from . import models  # noqa: F401 -- register ORM tables
from .database import Base, engine


def main() -> None:
    Base.metadata.create_all(bind=engine)
    print("Tabelas criadas/verificadas. Use migrações para bancos já existentes.")


if __name__ == "__main__":
    main()
