"""
Centralized configuration management.
All environment variables and settings are loaded and validated here.
"""

import os
from functools import lru_cache

from dotenv import load_dotenv
from pydantic_settings import BaseSettings

load_dotenv()


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Database
    database_url: str = "sqlite:///./sql_app.db"
    
    # JWT Authentication
    secret_key: str = ""
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    
    # CORS
    client_origin_url: str | None = None
    
    # Environment
    environment: str = "development"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache
def get_settings() -> Settings:
    """
    Cached settings instance.
    Use dependency injection: settings = Depends(get_settings)
    """
    return Settings()


# For convenience in modules that import directly
settings = get_settings()