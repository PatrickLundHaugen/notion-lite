import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from . import crud
from .database import get_db

class AuthConfig:
    # Loads sensitive configuration from environment variables (.env file).
    # Fails fast on startup if any required variables are missing.
    def __init__(self):
        load_dotenv()
        
        secret_key = os.getenv("SECRET_KEY")
        if not secret_key:
            raise ValueError("Missing SECRET_KEY environment variable")
        self.SECRET_KEY = secret_key

        algorithm = os.getenv("ALGORITHM")
        if not algorithm:
            raise ValueError("Missing ALGORITHM environment variable")
        self.ALGORITHM = algorithm

        expire_minutes_str = os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES")
        if not expire_minutes_str:
            raise ValueError("Missing ACCESS_TOKEN_EXPIRE_MINUTES environment variable")
        self.ACCESS_TOKEN_EXPIRE_MINUTES = int(expire_minutes_str)

# A single, global instance of the AuthConfig.
auth_config = AuthConfig()

# Defines the password hashing context, using bcrypt as the scheme.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Tells FastAPI how to find the token in a request. `tokenUrl` points to our login endpoint.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Verifies a plain text password against a stored hash.
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    # Generates a secure hash for a plain text password.
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    # Creates a new JWT access token.
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=auth_config.ACCESS_TOKEN_EXPIRE_MINUTES)
        
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(
        to_encode, 
        auth_config.SECRET_KEY, 
        algorithm=auth_config.ALGORITHM
    )
    return encoded_jwt

def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)
):
    # FastAPI dependency to decode a JWT and fetch the corresponding user from the DB.
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, auth_config.SECRET_KEY, algorithms=[auth_config.ALGORITHM]
        )
        subject = payload.get("sub")
        if subject is None or not isinstance(subject, str):
            raise credentials_exception
        username: str = subject
    except JWTError:
        raise credentials_exception
    
    user = crud.get_user_by_username(db, username=username)
    if user is None:
        raise credentials_exception
    return user