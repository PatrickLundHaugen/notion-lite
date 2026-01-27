"""
Authentication endpoints.

Handles:
- User registration
- Login (returns access token, sets refresh token cookie)
- Token refresh
- Current user info
"""

from typing import Optional

from fastapi import APIRouter, Cookie, Depends, status
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..config import settings
from ..database import get_db
from ..dependencies import get_current_user
from ..exceptions import BadRequestError, UnauthorizedError
from ..security import (
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    TokenType,
)


router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=schemas.UserPublic,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user"
)
def register(
    user: schemas.UserCreate,
    db: Session = Depends(get_db)
):
    """
    Register a new user account.
    
    - Username must be 3-50 characters, alphanumeric with underscores/hyphens
    - Password must be 8-128 characters
    """
    existing_user = crud.get_user_by_username(db, username=user.username)
    if existing_user:
        raise BadRequestError("Username already registered")
    
    return crud.create_user(db=db, user=user)


@router.post(
    "/token",
    response_model=schemas.Token,
    summary="Login to get access token"
)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Authenticate user and return access token.
    
    - Returns access token in response body
    - Sets refresh token in httponly cookie
    """
    user = crud.get_user_by_username(db, username=form_data.username)
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise UnauthorizedError("Incorrect username or password")
    
    access_token = create_access_token(subject=user.username)
    refresh_token = create_refresh_token(subject=user.username)
    
    response = JSONResponse(
        content={
            "access_token": access_token,
            "token_type": "bearer"
        }
    )
    
    # Set refresh token as httponly cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        samesite="lax",
        secure=settings.environment == "production",
        path="/",
        max_age=settings.refresh_token_expire_days * 24 * 60 * 60
    )
    
    return response


@router.post(
    "/token/refresh",
    response_model=schemas.Token,
    summary="Refresh access token"
)
def refresh_token(
    refresh_token: Optional[str] = Cookie(None),
    db: Session = Depends(get_db)
):
    """
    Get a new access token using the refresh token cookie.
    """
    if not refresh_token:
        raise UnauthorizedError("Missing refresh token")
    
    username = decode_token(refresh_token, TokenType.REFRESH)
    if username is None:
        raise UnauthorizedError("Invalid refresh token")
    
    user = crud.get_user_by_username(db, username=username)
    if not user:
        raise UnauthorizedError("User not found")
    
    new_access_token = create_access_token(subject=user.username)
    
    return schemas.Token(access_token=new_access_token)


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Logout and clear refresh token"
)
def logout():
    """
    Clear the refresh token cookie.
    """
    response = JSONResponse(content=None, status_code=status.HTTP_204_NO_CONTENT)
    response.delete_cookie(key="refresh_token", path="/")
    return response


@router.get(
    "/me",
    response_model=schemas.UserPublic,
    summary="Get current user info"
)
def get_me(
    current_user: schemas.User = Depends(get_current_user)
):
    """
    Get the currently authenticated user's information.
    """
    return current_user