import sqlite3
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from BackEnd.config import get_settings


def legacy_database(path: Path, duplicate: bool = False) -> None:
    with sqlite3.connect(path) as connection:
        connection.executescript("""
            CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT UNIQUE NOT NULL, hashed_password TEXT NOT NULL,
              full_name TEXT, is_active BOOLEAN, created_at DATETIME, updated_at DATETIME);
            CREATE TABLE favorite_places (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL, place_id_google TEXT NOT NULL,
              place_title TEXT, created_at DATETIME);
            INSERT INTO users VALUES (1, 'ANA@example.com', 'existing-hash', 'Ana', 1, '2026-01-01', NULL);
            INSERT INTO favorite_places VALUES (1, 1, 'place-test', 'Museu', '2026-01-01');
        """)
        if duplicate:
            connection.execute(
                "INSERT INTO favorite_places VALUES (2, 1, 'place-test', 'Museu', '2026-01-01')"
            )


def test_adopts_legacy_without_deleting_accounts(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    path = tmp_path / "legacy.db"
    legacy_database(path)
    monkeypatch.setenv("DATABASE_URL", "sqlite:///" + path.as_posix())
    get_settings.cache_clear()
    config = Config(str(Path(__file__).parents[1] / "alembic.ini"))
    try:
        command.upgrade(config, "head")
        with sqlite3.connect(path) as connection:
            assert connection.execute("SELECT email, hashed_password FROM users").fetchone() == (
                "ANA@example.com",
                "existing-hash",
            )
            assert connection.execute("SELECT count(*) FROM favorite_places").fetchone() == (1,)
            with pytest.raises(sqlite3.IntegrityError):
                connection.execute(
                    "INSERT INTO favorite_places VALUES (2, 1, 'place-test', 'Museu', '2026-01-01')"
                )
            assert connection.execute("SELECT version_num FROM alembic_version").fetchone() == (
                "0002_trips_schedule",
            )
    finally:
        monkeypatch.setenv("DATABASE_URL", "sqlite://")
        get_settings.cache_clear()


def test_does_not_silently_remove_duplicate_legacy_data(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    path = tmp_path / "duplicates.db"
    legacy_database(path, duplicate=True)
    monkeypatch.setenv("DATABASE_URL", "sqlite:///" + path.as_posix())
    get_settings.cache_clear()
    try:
        with pytest.raises(RuntimeError, match="duplicados"):
            command.upgrade(Config(str(Path(__file__).parents[1] / "alembic.ini")), "head")
        with sqlite3.connect(path) as connection:
            assert connection.execute("SELECT count(*) FROM favorite_places").fetchone() == (2,)
    finally:
        monkeypatch.setenv("DATABASE_URL", "sqlite://")
        get_settings.cache_clear()


def test_assigns_legacy_items_to_trip_preserving_import_markers(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    path = tmp_path / "itinerary.db"
    legacy_database(path)
    with sqlite3.connect(path) as connection:
        connection.executescript("""
          CREATE TABLE itinerary_items (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id),
            place_id_google TEXT, place_title TEXT NOT NULL, item_type TEXT NOT NULL, visit_date TEXT,
            number_of_people INTEGER, check_in_date TEXT, check_out_date TEXT, image_url TEXT,
            formatted_address TEXT, latitude FLOAT, longitude FLOAT, custom_notes TEXT, created_at DATETIME);
          INSERT INTO itinerary_items (id,user_id,place_title,item_type,visit_date,number_of_people,created_at)
            VALUES (42,1,'Museu','place','2026-10-12',2,'2026-10-01'), (43,1,'Parque','place','2026-10-12',1,'2026-10-01');
          CREATE TABLE itinerary_imports (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id),
            local_id TEXT NOT NULL, item_id INTEGER REFERENCES itinerary_items(id) ON DELETE SET NULL);
          INSERT INTO itinerary_imports VALUES (1,1,'old-museum',42);
        """)
    monkeypatch.setenv("DATABASE_URL", "sqlite:///" + path.as_posix())
    get_settings.cache_clear()
    try:
        command.upgrade(Config(str(Path(__file__).parents[1] / "alembic.ini")), "head")
        with sqlite3.connect(path) as connection:
            assert connection.execute("SELECT name,user_id FROM trips").fetchone() == ("Minha viagem", 1)
            rows = connection.execute(
                "SELECT id,trip_id,sort_order,visit_date FROM itinerary_items ORDER BY id"
            ).fetchall()
            assert rows == [(42, 1, 0, "2026-10-12"), (43, 1, 1, "2026-10-12")]
            assert connection.execute("SELECT local_id,item_id FROM itinerary_imports").fetchone() == (
                "old-museum",
                42,
            )
            assert connection.execute("PRAGMA foreign_key_check").fetchall() == []
    finally:
        monkeypatch.setenv("DATABASE_URL", "sqlite://")
        get_settings.cache_clear()
