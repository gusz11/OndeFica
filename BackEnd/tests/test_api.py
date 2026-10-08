from datetime import UTC, datetime, timedelta
from typing import Annotated

import jwt
import pytest
from BackEnd import crud_users
from BackEnd.config import get_settings
from BackEnd.database import get_db
from BackEnd.services import users
from fastapi import Depends
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session


def register(client: TestClient, email: str = "ana@example.com") -> dict[str, str]:
    response = client.post(
        "/auth/register", json={"email": email, "password": "safe-password-123", "full_name": "Ana"}
    )
    assert response.status_code == 201, response.text
    login = client.post("/auth/token", data={"username": email, "password": "safe-password-123"})
    assert login.status_code == 200, login.text
    return {"Authorization": "Bearer " + login.json()["access_token"]}


def visit(**changes: object) -> dict[str, object]:
    return {
        "place_id_google": "ChIJ-test",
        "place_title": "Museu",
        "item_type": "place",
        "visit_date": "2026-10-12",
        "number_of_people": 2,
        **changes,
    }


def hotel(check_in: str = "2026-10-12", check_out: str = "2026-10-15") -> dict[str, object]:
    return {
        "place_id_google": "hotel-test",
        "place_title": "Hotel",
        "item_type": "hotel",
        "check_in_date": check_in,
        "check_out_date": check_out,
    }


def test_login_profile_and_normalization(client: TestClient) -> None:
    headers = register(client, " ANA@example.com ")
    profile = client.get("/users/me/", headers=headers)
    assert profile.status_code == 200
    assert profile.json()["email"] == "ana@example.com"
    assert "hashed_password" not in profile.text
    assert profile.headers["cache-control"] == "no-store"


def test_duplicate_and_bad_password(client: TestClient) -> None:
    register(client)
    assert (
        client.post(
            "/auth/register", json={"email": "ANA@example.com", "password": "password123"}
        ).status_code
        == 409
    )
    assert (
        client.post("/auth/token", data={"username": "ana@example.com", "password": "wrong"}).status_code
        == 401
    )


def test_hash_upgrade_preserves_bcrypt_accounts(client: TestClient) -> None:
    headers = register(client)
    from pwdlib.hashers.bcrypt import BcryptHasher

    @client.app.get("/test/legacy-hash")
    def legacy(db: Annotated[Session, Depends(get_db)]) -> dict[str, bool]:
        user = crud_users.get_user_by_email(db, "ana@example.com")
        assert user is not None
        user.hashed_password = BcryptHasher().hash("legacy-pass123")
        db.commit()
        return {"ok": True}

    client.get("/test/legacy-hash", headers=headers)
    assert (
        client.post(
            "/auth/token", data={"username": "ana@example.com", "password": "legacy-pass123"}
        ).status_code
        == 200
    )


def test_invalid_and_expired_tokens(client: TestClient) -> None:
    register(client)
    settings = get_settings()
    now = datetime.now(UTC)
    payload = {
        "sub": "1",
        "iat": now - timedelta(hours=1),
        "exp": now - timedelta(minutes=1),
        "iss": settings.jwt_issuer,
        "aud": settings.jwt_audience,
        "jti": "test",
    }
    expired = jwt.encode(payload, settings.jwt_secret_key.get_secret_value(), algorithm="HS256")
    assert client.get("/users/me/", headers={"Authorization": "Bearer " + expired}).status_code == 401
    assert client.get("/users/me/", headers={"Authorization": "Bearer bogus"}).status_code == 401
    assert client.get("/itinerary/").status_code == 401


def test_itinerary_crud_and_owner_isolation(client: TestClient) -> None:
    owner = register(client)
    other = register(client, "bia@example.com")
    response = client.post("/itinerary/", json=visit(latitude=0, longitude=0), headers=owner)
    assert response.status_code == 201, response.text
    item_id = response.json()["id"]
    assert client.get("/itinerary/", headers=other).json() == []
    assert (
        client.patch(f"/itinerary/{item_id}", json={"number_of_people": 9}, headers=other).status_code == 404
    )
    assert client.delete(f"/itinerary/{item_id}", headers=other).status_code == 404
    updated = client.patch(f"/itinerary/{item_id}", json={"number_of_people": 3}, headers=owner)
    assert updated.json()["number_of_people"] == 3
    assert client.delete(f"/itinerary/{item_id}", headers=owner).status_code == 204
    assert client.get("/itinerary/", headers=owner).json() == []


@pytest.mark.parametrize(
    "changes",
    [
        {"visit_date": "2026-02-30"},
        {"visit_date": "12/10/2026"},
        {"number_of_people": 0},
        {"number_of_people": 1001},
        {"number_of_people": "2"},
        {"latitude": 91, "longitude": 0},
        {"latitude": 0},
        {"place_title": " "},
        {"user_id": 99},
        {"image_url": "javascript:alert(1)"},
        {"image_url": "https://maps.googleapis.com/photo?key=secret"},
        {"visit_date": None},
    ],
)
def test_rejects_invalid_itinerary_payload(client: TestClient, changes: dict[str, object]) -> None:
    headers = register(client)
    assert client.post("/itinerary/", json=visit(**changes), headers=headers).status_code == 422


def test_patch_validates_merged_data(client: TestClient) -> None:
    headers = register(client)
    item = client.post("/itinerary/", json=visit(), headers=headers).json()
    for changes in [
        {"place_title": None},
        {"visit_date": None},
        {"visit_date": "2026-02-30"},
        {"check_in_date": "2026-10-11"},
    ]:
        assert client.patch(f"/itinerary/{item['id']}", json=changes, headers=headers).status_code == 422
    assert client.get("/itinerary/", headers=headers).json()[0]["visit_date"] == "2026-10-12"


def test_hotel_overlaps_and_adjacent_stays(client: TestClient) -> None:
    headers = register(client)
    first = client.post("/itinerary/", json=hotel(), headers=headers)
    assert first.status_code == 201
    assert (
        client.post("/itinerary/", json=hotel("2026-10-13", "2026-10-16"), headers=headers).status_code == 409
    )
    adjacent = client.post("/itinerary/", json=hotel("2026-10-15", "2026-10-16"), headers=headers)
    assert adjacent.status_code == 201
    assert (
        client.patch(
            f"/itinerary/{adjacent.json()['id']}", json={"check_in_date": "2026-10-14"}, headers=headers
        ).status_code
        == 409
    )
    assert (
        client.patch(
            f"/itinerary/{first.json()['id']}", json={"check_out_date": "2026-10-12"}, headers=headers
        ).status_code
        == 422
    )


def test_favorites_idempotent_and_private(client: TestClient) -> None:
    owner = register(client)
    other = register(client, "bia@example.com")
    favorite = {"place_id_google": "ChIJ-test", "place_title": "Museu"}
    first = client.post("/favorites/", json=favorite, headers=owner)
    second = client.post("/favorites/", json=favorite, headers=owner)
    assert first.status_code == second.status_code == 200
    assert first.json()["id"] == second.json()["id"]
    assert client.get("/favorites/", headers=other).json() == []
    assert client.delete("/favorites/ChIJ-test", headers=other).status_code == 204
    assert len(client.get("/favorites/", headers=owner).json()) == 1


def test_restricts_admin_and_google_audience_config(client: TestClient) -> None:
    headers = register(client)
    assert client.post("/admin/clear_cache", headers=headers).status_code == 403
    assert client.post("/auth/google", json={"id_token": "bogus"}).status_code == 503
    assert client.get("/api/pontos").status_code == 503


def test_google_rejects_unverified_email(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(get_settings(), "google_client_ids", ["trusted"])
    monkeypatch.setattr(
        users,
        "verify_oauth2_token",
        lambda *_args, **_kwargs: {"email": "ana@example.com", "aud": "trusted", "email_verified": False},
    )
    assert client.post("/auth/google", json={"id_token": "bogus"}).status_code == 401


def test_limits_payloads_and_auth_attempts(client: TestClient) -> None:
    assert client.post("/auth/register", content=b"x" * 131073).status_code == 413
    for _ in range(10):
        assert (
            client.post(
                "/auth/token", data={"username": "unknown@example.com", "password": "bad"}
            ).status_code
            == 401
        )
    assert (
        client.post("/auth/token", data={"username": "unknown@example.com", "password": "bad"}).status_code
        == 429
    )


def test_google_transport_failure_is_safe(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    from google.auth.exceptions import TransportError

    monkeypatch.setattr(get_settings(), "google_client_ids", ["trusted"])

    def unavailable(*_args: object, **_kwargs: object) -> None:
        raise TransportError("private transport details")

    monkeypatch.setattr(users, "verify_oauth2_token", unavailable)
    response = client.post("/auth/google", json={"id_token": "bogus"})
    assert response.status_code == 503
    assert "private transport details" not in response.text


def test_validation_does_not_echo_password(client: TestClient) -> None:
    response = client.post("/auth/register", json={"email": "invalid", "password": "s3cret"})
    assert response.status_code == 422
    assert "s3cret" not in response.text and '"input"' not in response.text


def test_global_error_has_no_sensitive_details(client: TestClient) -> None:
    @client.app.get("/test/failure")
    def failure() -> None:
        raise RuntimeError("database-password-secret")

    response = client.get("/test/failure")
    assert response.status_code == 500
    assert "database-password-secret" not in response.text
    assert response.json()["request_id"]


def test_cors_and_query_bounds(client: TestClient) -> None:
    assert (
        client.get("/health", headers={"Origin": "http://localhost:8081"}).headers[
            "access-control-allow-origin"
        ]
        == "http://localhost:8081"
    )
    assert (
        "access-control-allow-origin"
        not in client.get("/health", headers={"Origin": "https://evil.example"}).headers
    )
    assert client.get("/api/pontos?limit=1000").status_code == 422
    headers = register(client)
    assert client.get("/itinerary/?skip=-1", headers=headers).status_code == 422


def test_legacy_import_is_atomic_and_idempotent(client: TestClient) -> None:
    headers = register(client)
    data = {"entries": [{"local_id": "old-visit", "item": visit()}]}
    first = client.post("/itinerary/import", json=data, headers=headers)
    assert first.status_code == 200, first.text
    assert first.json() == {"imported": 1, "already_imported": 0}
    second = client.post("/itinerary/import", json=data, headers=headers)
    assert second.json() == {"imported": 0, "already_imported": 1}
    assert len(client.get("/itinerary/", headers=headers).json()) == 1
    conflicting = {
        "entries": [{"local_id": "old-hotel1", "item": hotel()}, {"local_id": "old-hotel2", "item": hotel()}]
    }
    assert client.post("/itinerary/import", json=conflicting, headers=headers).status_code == 409
    assert len(client.get("/itinerary/", headers=headers).json()) == 1
