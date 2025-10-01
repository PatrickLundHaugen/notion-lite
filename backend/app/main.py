import os
from typing import List

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from . import crud, models, schemas, security
from .database import engine, get_db

load_dotenv()

# Create all database tables on startup (if they don't already exist).
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# --- Middleware ---

# List of allowed origins for Cross-Origin Resource Sharing (CORS).
origins = [
    "http://localhost:5173", # Default Vite dev server port.
    "http://localhost:3000", # Default Create React App port.
]

CLIENT_ORIGIN_URL = os.getenv("CLIENT_ORIGIN_URL")

if CLIENT_ORIGIN_URL:
    origins.append(CLIENT_ORIGIN_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Authentication & User Endpoints ---

@app.post("/users", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Endpoint for new user registration.
    db_user = crud.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    return crud.create_user(db=db, user=user)

@app.post("/token", response_model=schemas.Token)
def login_for_access_token(
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
):
    # Endpoint for user login, returns a JWT access token.
    user = crud.get_user_by_username(db, username=form_data.username)
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = security.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(security.get_current_user)):
    # Endpoint to fetch the profile of the currently authenticated user.
    return current_user

# --- Page Endpoints (CRUD) ---

@app.post("/pages", response_model=schemas.Page, status_code=status.HTTP_201_CREATED)
def create_page_for_user(
    page: schemas.PageCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    # Endpoint to create a new page for the current user.
    return crud.create_user_page(db=db, page=page, user_id=current_user.id)

@app.get("/pages", response_model=List[schemas.Page])
def read_user_pages(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    # Endpoint to retrieve all pages belonging to the current user.
    return crud.get_pages_by_user(db=db, user_id=current_user.id)

@app.get("/pages/{page_id}", response_model=schemas.Page)
def read_page(
    page_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    # Endpoint to retrieve a single page, ensuring it belongs to the user.
    db_page = db.get(models.Page, page_id)
    if db_page is None:
        raise HTTPException(status_code=404, detail="Page not found")
    if db_page.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this page")
    return db_page

@app.put("/pages/{page_id}", response_model=schemas.Page)
def update_page(
    page_id: int,
    page: schemas.PageCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    # Endpoint to update a page owned by the current user.
    db_page = db.get(models.Page, page_id)
    if db_page is None:
        raise HTTPException(status_code=404, detail="Page not found")
    if db_page.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this page")
    
    db_page.title = page.title
    db_page.content = page.content
    db.commit()
    db.refresh(db_page)
    return db_page

@app.delete("/pages/{page_id}")
def delete_page(
    page_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    # Endpoint to delete a page owned by the current user.
    db_page = db.get(models.Page, page_id)
    if db_page is None:
        raise HTTPException(status_code=404, detail="Page not found")
    if db_page.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this page")
    
    db.delete(db_page)
    db.commit()
    return {"message": "Page deleted successfully"}