"""
Authentication and security utilities.

Features:
- Password hashing with bcrypt
- JWT token creation with type discrimination
- Token validation
"""

from datetime import datetime, timedelta, timezone
from enum import Enum

from jose import JWTError, jwt
from passlib.context import CryptContext

from .config import settings


class TokenType(str, Enum):
    """Token type discriminator to prevent token confusion attacks."""
    ACCESS = "access"
    REFRESH = "refresh"


# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain text password against a stored hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Generate a secure bcrypt hash for a password."""
    return pwd_context.hash(password)


def create_access_token(subject: str) -> str:
    """
    Create a new JWT access token.
    
    Args:
        subject: The token subject (typically username)
        
    Returns:
        Encoded JWT string
    """
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_expire_minutes
    )
    
    payload = {
        "sub": subject,
        "exp": expire,
        "type": TokenType.ACCESS.value,
        "iat": datetime.now(timezone.utc),
    }
    
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def create_refresh_token(subject: str) -> str:
    """
    Create a new JWT refresh token.
    
    Args:
        subject: The token subject (typically username)
        
    Returns:
        Encoded JWT string
    """
    expire = datetime.now(timezone.utc) + timedelta(
        days=settings.refresh_token_expire_days
    )
    
    payload = {
        "sub": subject,
        "exp": expire,
        "type": TokenType.REFRESH.value,
        "iat": datetime.now(timezone.utc),
    }
    
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def decode_token(token: str, expected_type: TokenType) -> str | None:
    """
    Decode and validate a JWT token.
    
    Args:
        token: The JWT token string
        expected_type: The expected token type (access or refresh)
        
    Returns:
        The subject (username) if valid, None otherwise
    """
    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.algorithm]
        )
        
        # Validate token type
        token_type = payload.get("type")
        if token_type != expected_type.value:
            return None
        
        # Extract subject
        subject: str | None = payload.get("sub")
        if subject is None or not isinstance(subject, str):
            return None
            
        return subject
        
    except JWTError:
        return None