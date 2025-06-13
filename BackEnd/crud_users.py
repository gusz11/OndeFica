from sqlalchemy.orm import Session
from passlib.context import CryptContext
from typing import Optional, List 

import models 
import schemas

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica se a senha fornecida corresponde à senha hashada."""
    return pwd_context.verify(plain_password, hashed_password)

def get_hashed_password(password: str) -> str:
    """Gera o hash de uma senha."""
    return pwd_context.hash(password)

def get_user(db: Session, user_id: int) -> Optional[models.User]:
    """Busca um usuário pelo ID."""
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    """Busca um usuário pelo email."""
    return db.query(models.User).filter(models.User.email == email).first()

def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[models.User]: 
    """Busca uma lista de usuários com paginação."""
    return db.query(models.User).offset(skip).limit(limit).all()

def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    """Cria um novo usuário no banco de dados."""
    hashed_password = get_hashed_password(user.password)
    db_user = models.User(
        email=user.email, 
        hashed_password=hashed_password,
        full_name=user.full_name
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user