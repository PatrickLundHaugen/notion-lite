from sqlalchemy.orm import Session

from . import models, schemas, security

# --- User CRUD Functions ---

def get_user_by_username(db: Session, username: str):
    # Fetches a user from the database by their username.
    return db.query(models.User).filter(models.User.username == username).first()

def create_user(db: Session, user: schemas.UserCreate):
    # Hashes the password and creates a new user in the database.
    hashed_password = security.get_password_hash(user.password)
    db_user = models.User(username=user.username, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user) # Refresh to get the new user ID from the database.
    return db_user

# --- Page CRUD Functions ---

def get_pages_by_user(db: Session, user_id: int):
    # Fetches all pages from the database that belong to a specific user.
    return db.query(models.Page).filter(models.Page.owner_id == user_id).all()

def create_user_page(db: Session, page: schemas.PageCreate, user_id: int):
    # Creates a new page associated with a specific user.
    # `page.model_dump()` converts the Pydantic schema to a dict.
    db_page = models.Page(**page.model_dump(), owner_id=user_id)
    db.add(db_page)
    db.commit()
    db.refresh(db_page) # Refresh to get the new page ID.
    return db_page