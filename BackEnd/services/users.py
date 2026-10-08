import secrets
from functools import partial

import requests
from fastapi import HTTPException
from google.auth.exceptions import TransportError
from google.auth.transport.requests import Request as GoogleRequest
from google.oauth2.id_token import verify_oauth2_token
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .. import auth, crud_users, models, schemas
from ..config import get_settings


def register(db: Session, data: schemas.UserCreate) -> models.User:
    if crud_users.get_user_by_email(db, str(data.email)):
        raise HTTPException(409, "Email já registrado")
    try:
        return crud_users.create_user(db, data)
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Email já registrado") from None


def login(db: Session, email: str, password: str) -> schemas.Token:
    if len(email) > 254 or len(password) > 128:
        raise HTTPException(401, "Email ou senha incorretos")
    user = crud_users.get_user_by_email(db, email)
    valid, upgraded = crud_users.verify_password(
        password, user.hashed_password if user else crud_users.DUMMY_HASH
    )
    if not user or not valid or not user.is_active:
        raise HTTPException(401, "Email ou senha incorretos", headers={"WWW-Authenticate": "Bearer"})
    if upgraded:
        user.hashed_password = upgraded
        db.commit()
    return schemas.Token(access_token=auth.create_access_token(user))


def google_login(db: Session, data: schemas.GoogleIdToken) -> schemas.Token:
    audiences = get_settings().google_client_ids
    if not audiences:
        raise HTTPException(503, "Login Google não configurado")
    try:
        # Signature, expiry, issuer and explicitly allowed audiences all matter.
        with requests.Session() as session:
            # Certificate lookup must not hold a request worker for the default 120 seconds.
            request = partial(GoogleRequest(session).__call__, timeout=10)
            info = verify_oauth2_token(data.id_token, request, audience=None)
        if info.get("aud") not in audiences or info.get("email_verified") is not True:
            raise ValueError("Untrusted Google claims")
        candidate = schemas.UserCreate(
            email=info.get("email"), full_name=info.get("name"), password=secrets.token_urlsafe(48)
        )
    except (ValueError, TypeError):
        raise HTTPException(401, "Token Google inválido") from None
    except TransportError:
        raise HTTPException(503, "Login Google temporariamente indisponível") from None
    user = crud_users.get_user_by_email(db, str(candidate.email))
    if user is None:
        user = register(db, candidate)
    if not user.is_active:
        raise HTTPException(401, "Usuário inativo")
    return schemas.Token(access_token=auth.create_access_token(user))
