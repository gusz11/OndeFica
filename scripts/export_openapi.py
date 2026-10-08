"""Export the contract without requiring a real secret or contacting any service."""

import json
import os
import secrets
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
os.environ["JWT_SECRET_KEY"] = secrets.token_urlsafe(48)
os.environ["ENVIRONMENT"] = "test"
os.environ["DATABASE_URL"] = "sqlite://"
os.environ["AUTO_CREATE_TABLES"] = "false"

from BackEnd.main import app


def contract() -> str:
    return json.dumps(app.openapi(), ensure_ascii=False, indent=2) + "\n"


if __name__ == "__main__":
    (ROOT / "BackEnd/openapi.json").write_text(contract(), encoding="utf-8")
    print("Contrato OpenAPI exportado")
