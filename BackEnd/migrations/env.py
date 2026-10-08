from alembic import context
from BackEnd import models  # noqa: F401
from BackEnd.config import get_settings
from BackEnd.database import Base
from sqlalchemy import create_engine, pool


def run_migrations_online() -> None:
    engine = create_engine(get_settings().database_url, poolclass=pool.NullPool)
    with engine.connect() as connection:
        context.configure(connection=connection, target_metadata=Base.metadata)
        with context.begin_transaction():
            context.run_migrations()
    engine.dispose()


if context.is_offline_mode():
    raise RuntimeError("Esta migração inicial exige inspeção online do banco.")
else:
    run_migrations_online()
