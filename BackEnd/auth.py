# OndeFicaBack/auth.py
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import ValidationError
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone 
from typing import Optional

import crud_users
import models
import schemas
import database
from config import settings 

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token") 

# FUNÇÕES PARA TOKEN JWT
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta 
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

async def get_current_user(
    token: str = Depends(oauth2_scheme), 
    db: Session = Depends(database.get_db)
) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não foi possível validar as credenciais",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: Optional[str] = payload.get("sub")
        user_id: Optional[int] = payload.get("user_id") 
        
        if email is None and user_id is None: 
            raise credentials_exception
        

        user: Optional[models.User] = None
        if user_id:
            user = crud_users.get_user(db, user_id=user_id)
        elif email: 
             user = crud_users.get_user_by_email(db, email=email)

        if user is None:
            raise credentials_exception
        
        if not user.is_active:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Usuário inativo")
            
        return user
    except (JWTError, ValidationError) as e:
        print(f"Erro de token JWT ou Validação: {e}") 
        raise credentials_exception


async def get_current_active_user(current_user: models.User = Depends(get_current_user)):
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Usuário inativo")
    return current_user