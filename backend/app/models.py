from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base

class User(Base):
    # Represents the "users" table in the database.
    __tablename__ = "users"

    # Columns for the users table
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String, unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String)
    
    # Establishes a one-to-many relationship with the Page model.
    # 'back_populates' links this to the 'owner' attribute in the Page model.
    pages: Mapped[list["Page"]] = relationship("Page", back_populates="owner")

class Page(Base):
    # Represents the "pages" table in the database.
    __tablename__ = "pages"

    # Columns for the pages table.
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String, index=True)
    content: Mapped[str] = mapped_column(String)

    # Foreign key to link a page to its owner in the "users" table.
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    
    # Establishes a many-to-one relationship with the User model.
    # This provides a convenient 'owner' attribute to access the parent User object.
    owner: Mapped["User"] = relationship("User", back_populates="pages")