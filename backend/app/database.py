import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

# Use DATABASE_URL from environment, falling back to a local SQLite DB for development.
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./sql_app.db")

# The engine is the entry point to the database.
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    # `connect_args` is a SQLite-specific option to allow multi-threaded access.
    connect_args={"check_same_thread": False} if SQLALCHEMY_DATABASE_URL.startswith("sqlite") else {},
)

# Each instance of SessionLocal will be a database session.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for our ORM models to inherit from.
Base = declarative_base()

def get_db():
    # FastAPI dependency that provides a database session per request.
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()