"""
Shared FastAPI dependencies.

Provides reusable dependencies for authentication, database access,
and resource validation.
"""

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from . import crud, models
from .database import get_db
from .exceptions import UnauthorizedError
from .security import decode_token, TokenType


# OAuth2 scheme for extracting Bearer tokens
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")


async def get_current_username(
    token: str = Depends(oauth2_scheme)
) -> str:
    """
    Extract and validate username from JWT access token.
    
    Raises:
        UnauthorizedError: If token is invalid or not an access token
    """
    username = decode_token(token, TokenType.ACCESS)
    
    if username is None:
        raise UnauthorizedError()
    
    return username


def get_current_user(
    username: str = Depends(get_current_username),
    db: Session = Depends(get_db)
) -> models.User:
    """
    Get the current authenticated user from the database.
    
    Raises:
        UnauthorizedError: If user not found in database
    """
    user = crud.get_user_by_username(db, username=username)
    
    if user is None:
        raise UnauthorizedError("User not found")
    
    return user


# Type alias for cleaner route signatures
CurrentUser = models.User