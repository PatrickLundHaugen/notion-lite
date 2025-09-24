from pydantic import BaseModel

# --- Page Schemas ---

class PageBase(BaseModel):
    # Shared attributes for a Page, used as a base for other schemas.
    title: str
    content: str

class PageCreate(PageBase):
    # Schema used when creating a new page via the API.
    pass

class Page(PageBase):
    # Schema used when reading/returning a page from the API.
    id: int
    owner_id: int

    class Config:
        # Allows Pydantic to read data from ORM models (e,g,, SQLAlchemy).
        from_attributes = True

# --- User Schemas ---

class UserBase(BaseModel):
    # Shared attribute for a User
    username: str

class UserCreate(UserBase):
    # Schema used when creating a new user; includes the password.
    password: str

class User(UserBase):
    # Schema used when reading/returning a user from the API; omits the password.
    id: int
    pages: list[Page] = []

    class Config:
        from_attributes = True

# --- Token Schema ---

class Token(BaseModel):
    # Schema for the authentication token response.
    access_token: str
    token_type: str