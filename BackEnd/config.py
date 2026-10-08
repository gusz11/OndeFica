"""Validated configuration; these variables must never be copied to Expo."""

from functools import lru_cache
from pathlib import Path
from typing import Literal, Self
from urllib.parse import urlsplit

from pydantic import Field, SecretStr, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=Path(__file__).parent / ".env", env_file_encoding="utf-8", extra="ignore"
    )
    environment: Literal["development", "test", "production"] = "development"
    database_url: str = "sqlite:///./ondefica_dev.db"
    jwt_secret_key: SecretStr = Field(min_length=32)
    access_token_expire_minutes: int = Field(default=30, ge=5, le=60)
    jwt_issuer: str = "ondefica-api"
    jwt_audience: str = "ondefica-app"
    google_places_api_key: SecretStr | None = None
    google_places_mode: Literal["demo", "standard"] = "demo"
    google_client_ids: list[str] = Field(default_factory=list)
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:8081"])
    admin_emails: list[str] = Field(default_factory=list)
    auto_create_tables: bool = True

    @field_validator("cors_origins")
    @classmethod
    def validate_origins(cls, origins: list[str]) -> list[str]:
        for origin in origins:
            parsed = urlsplit(origin)
            if (
                parsed.scheme not in {"http", "https"}
                or not parsed.netloc
                or parsed.path
                or parsed.query
                or parsed.fragment
                or parsed.username
                or "*" in origin
            ):
                raise ValueError("CORS exige origens explícitas, sem caminho ou curingas")
        return origins

    @model_validator(mode="after")
    def production_settings(self) -> Self:
        secret = self.jwt_secret_key.get_secret_value()
        if secret.lower().startswith(("change", "troque", "uma_chave")) or len(set(secret)) < 10:
            raise ValueError("Configure uma chave JWT aleatória e exclusiva")
        if self.environment == "production":
            if self.auto_create_tables or self.database_url.startswith("sqlite"):
                raise ValueError("Produção exige banco externo e migrações explícitas")
            if any(not origin.startswith("https://") for origin in self.cors_origins):
                raise ValueError("CORS em produção exige HTTPS")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
