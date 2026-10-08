from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from .. import auth, database, schemas
from ..services import users
from ..services.rate_limit import limit_auth

router = APIRouter()
DB = Annotated[Session, Depends(database.get_db)]


@router.post(
    "/auth/register",
    response_model=schemas.UserResponse,
    status_code=201,
    tags=["Authentication"],
    dependencies=[Depends(limit_auth)],
)
def register(data: schemas.UserCreate, db: DB) -> object:
    return users.register(db, data)


@router.post(
    "/auth/token", response_model=schemas.Token, tags=["Authentication"], dependencies=[Depends(limit_auth)]
)
def login(form: Annotated[OAuth2PasswordRequestForm, Depends()], db: DB) -> schemas.Token:
    return users.login(db, form.username, form.password)


@router.post(
    "/auth/google", response_model=schemas.Token, tags=["Authentication"], dependencies=[Depends(limit_auth)]
)
def google_login(data: schemas.GoogleIdToken, db: DB) -> schemas.Token:
    return users.google_login(db, data)


@router.get("/users/me/", response_model=schemas.UserResponse, tags=["Users"])
def current_user(user: auth.CurrentUser) -> object:
    return user
