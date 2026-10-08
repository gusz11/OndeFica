from pwdlib import PasswordHash
from pwdlib.hashers.argon2 import Argon2Hasher
from pwdlib.hashers.bcrypt import BcryptHasher
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from . import models, schemas

# Argon2 for new hashes; old bcrypt accounts remain usable and upgrade on login.
password_hash = PasswordHash((Argon2Hasher(), BcryptHasher()))
DUMMY_HASH = password_hash.hash("unrelated-dummy-password-for-timing")


def verify_password(password: str, hashed: str) -> tuple[bool, str | None]:
    try:
        return password_hash.verify_and_update(password, hashed)
    except (ValueError, OverflowError):
        return False, None


def get_user(db: Session, user_id: int) -> models.User | None:
    return db.get(models.User, user_id)


def get_user_by_email(db: Session, email: str) -> models.User | None:
    return db.scalar(select(models.User).where(func.lower(models.User.email) == email.strip().lower()))


def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    db_user = models.User(
        email=str(user.email), hashed_password=password_hash.hash(user.password), full_name=user.full_name
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
