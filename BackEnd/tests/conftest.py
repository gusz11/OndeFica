import os
from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

# Test-only configuration. No production secrets or Google requests are used.
os.environ["JWT_SECRET_KEY"] = "test-only-key-0123456789-abcdefghijklmnopqrstuvwxyz"
os.environ["ENVIRONMENT"] = "test"
os.environ["DATABASE_URL"] = "sqlite://"
os.environ["AUTO_CREATE_TABLES"] = "false"
os.environ["GOOGLE_PLACES_API_KEY"] = ""
os.environ["GOOGLE_PLACES_MODE"] = "demo"
os.environ["GOOGLE_CLIENT_IDS"] = "[]"
os.environ["ADMIN_EMAILS"] = "[]"
os.environ["CORS_ORIGINS"] = '["http://localhost:8081"]'

from BackEnd.database import Base, get_db  # noqa: E402
from BackEnd.main import create_app  # noqa: E402
from BackEnd.services.rate_limit import limiter  # noqa: E402


@pytest.fixture
def client() -> Iterator[TestClient]:
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    app = create_app()

    def test_db() -> Iterator[Session]:
        with Session(engine, expire_on_commit=False) as session:
            try:
                yield session
            except Exception:
                session.rollback()
                raise

    app.dependency_overrides[get_db] = test_db
    limiter.events.clear()
    with TestClient(app, raise_server_exceptions=False) as test_client:
        yield test_client
    Base.metadata.drop_all(engine)
    engine.dispose()
