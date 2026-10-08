"""Create a test account in the local development database, without resetting existing users."""

import argparse
import os
import secrets
import string
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))


def main() -> None:
    from BackEnd.config import get_settings

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--email", default="teste@example.com")
    arguments = parser.parse_args()
    settings = get_settings()
    if settings.environment != "development" or not settings.database_url.startswith(
        "sqlite"
    ):
        raise SystemExit(
            "Este comando exige o banco SQLite local e ENVIRONMENT=development."
        )
    os.chdir(ROOT)

    from BackEnd import crud_users, schemas
    from BackEnd.database import SessionLocal
    from BackEnd.services.users import login, register

    password = "".join(
        secrets.choice(string.ascii_letters + string.digits) for _ in range(16)
    )
    candidate = schemas.UserCreate(
        email=arguments.email, password=password, full_name="Teste no celular"
    )
    with SessionLocal() as session:
        if crud_users.get_user_by_email(session, str(candidate.email)):
            raise SystemExit(
                "Essa conta já existe. Nenhuma senha foi alterada; use outro --email."
            )
        user = register(session, candidate)
        # Exercise the same password/JWT flow used by the app, without logging a token.
        login(session, user.email, password)
    print("Conta criada e login validado no banco local de desenvolvimento.")
    print(f"Email: {user.email}")
    print(f"Senha: {password}")
    print("A senha é exibida somente nesta execução e não é salva em arquivo de texto.")


if __name__ == "__main__":
    main()
