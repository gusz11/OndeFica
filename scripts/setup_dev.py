"""Create local development env files without overwriting existing credentials."""

import secrets
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
backend = ROOT / "BackEnd/.env"
frontend = ROOT / "FrontEnd/.env"
if not backend.exists():
    example = (ROOT / "BackEnd/.env.example").read_text(encoding="utf-8")
    example = example.replace(
        "CHANGE_ME_GENERATE_A_RANDOM_KEY_WITH_AT_LEAST_32_CHARACTERS",
        secrets.token_urlsafe(48),
    )
    backend.write_text(example, encoding="utf-8")
    print("BackEnd/.env criado com uma chave JWT local aleatória.")
if not frontend.exists():
    frontend.write_text(
        (ROOT / "FrontEnd/.env.example").read_text(encoding="utf-8"), encoding="utf-8"
    )
    print("FrontEnd/.env criado. Ajuste a URL da API para seu dispositivo.")
