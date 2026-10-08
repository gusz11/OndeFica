"""Initialize fresh databases or adopt the original schema without deleting user data."""

from alembic import op
from BackEnd.database import Base
from BackEnd.models import FavoritePlace, User
from sqlalchemy import func, inspect, select

revision: str = "0001_initial"
down_revision: str | None = None
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    connection = op.get_bind()
    # Preflight existing tables before making any changes.
    inspector = inspect(connection)
    tables = inspector.get_table_names()
    if "favorite_places" in tables:
        duplicate = connection.execute(
            select(FavoritePlace.user_id)
            .group_by(FavoritePlace.user_id, FavoritePlace.place_id_google)
            .having(func.count() > 1)
        ).first()
        if duplicate:
            raise RuntimeError("Favoritos duplicados no banco legado. Revise-os antes de aplicar a migração.")
    if "users" in tables:
        duplicate_email = connection.execute(
            select(func.lower(User.email)).group_by(func.lower(User.email)).having(func.count() > 1)
        ).first()
        if duplicate_email:
            raise RuntimeError("Emails duplicados por diferença de maiúsculas. Revise-os antes da migração.")

    Base.metadata.create_all(connection, checkfirst=True)
    inspector = inspect(connection)
    favorite_unique = inspector.get_unique_constraints("favorite_places")
    indexes = inspector.get_indexes("favorite_places")
    if not any(
        set(item.get("column_names", [])) == {"user_id", "place_id_google"}
        for item in favorite_unique + [index for index in indexes if index.get("unique")]
    ):
        op.create_index(
            "uq_favorite_owner_place", "favorite_places", ["user_id", "place_id_google"], unique=True
        )
    # A functional unique index also protects old mixed-case emails against concurrent signups.
    connection.exec_driver_sql(
        "CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email_lower ON users (lower(email))"
    )
    for table in ("itinerary_items", "favorite_places"):
        if not any(index["column_names"] == ["user_id"] for index in inspect(connection).get_indexes(table)):
            op.create_index(f"ix_{table}_user_id", table, ["user_id"])


def downgrade() -> None:
    raise RuntimeError("Esta baseline preserva dados legados e não oferece downgrade destrutivo automático.")
