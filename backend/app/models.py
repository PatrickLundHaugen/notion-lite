"""
SQLAlchemy ORM models.

All models include:
- Proper indexes on foreign keys and commonly queried fields
- Cascade delete rules for referential integrity
- Type hints using Mapped[] syntax
"""

from datetime import datetime
from typing import List, Optional

from sqlalchemy import ForeignKey, String, Text, DateTime, Table, Column, Integer, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


# === Association Tables ===

page_tags = Table(
    "page_tags",
    Base.metadata,
    Column("page_id", Integer, ForeignKey("pages.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)


# === Models ===

class User(Base):
    """Registered user account."""
    
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)

    # Relationships - cascade delete all user content
    pages: Mapped[List["Page"]] = relationship(
        "Page",
        back_populates="owner",
        cascade="all, delete-orphan"
    )
    tags: Mapped[List["Tag"]] = relationship(
        "Tag",
        back_populates="owner",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<User(id={self.id}, username='{self.username}')>"


class Tag(Base):
    """User-created tag for organizing pages."""
    
    __tablename__ = "tags"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    color: Mapped[str] = mapped_column(String(20), nullable=False, default="gray")
    owner_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True  # Index for owner_id queries
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    # Relationships
    owner: Mapped["User"] = relationship("User", back_populates="tags")
    pages: Mapped[List["Page"]] = relationship(
        "Page",
        secondary=page_tags,
        back_populates="tags"
    )

    # Composite index for unique tag names per user
    __table_args__ = (
        Index("ix_tags_owner_name", "owner_id", "name", unique=True),
    )

    def __repr__(self) -> str:
        return f"<Tag(id={self.id}, name='{self.name}', color='{self.color}')>"


class Page(Base):
    """User-created note/page with optional hierarchy."""
    
    __tablename__ = "pages"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    slug: Mapped[str] = mapped_column(String(21), unique=True, index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(500), index=True, nullable=False)
    content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    owner_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True  # Index for owner_id queries
    )
    parent_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("pages.id", ondelete="CASCADE"),
        nullable=True,
        index=True  # Index for parent lookups
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    # Relationships
    owner: Mapped["User"] = relationship("User", back_populates="pages")
    parent: Mapped[Optional["Page"]] = relationship(
        "Page",
        back_populates="children",
        remote_side=[id]
    )
    children: Mapped[List["Page"]] = relationship(
        "Page",
        back_populates="parent",
        cascade="all, delete-orphan"
    )
    tags: Mapped[List["Tag"]] = relationship(
        "Tag",
        secondary=page_tags,
        back_populates="pages"
    )
    versions: Mapped[List["PageVersion"]] = relationship(
        "PageVersion",
        back_populates="page",
        cascade="all, delete-orphan",
        order_by="desc(PageVersion.created_at)"
    )

    def __repr__(self) -> str:
        return f"<Page(id={self.id}, title='{self.title}')>"


class PageVersion(Base):
    """
    Snapshot of a page at a point in time.
    
    Stores full content (not deltas) for reliable restoration.
    Automatically cleaned up to keep last 50 versions per page.
    """
    
    __tablename__ = "page_versions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    page_id: Mapped[int] = mapped_column(
        ForeignKey("pages.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    content_length: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)

    # Relationships
    page: Mapped["Page"] = relationship("Page", back_populates="versions")

    # Indexes for efficient queries
    __table_args__ = (
        # Index for listing versions by page, newest first
        Index("ix_page_versions_page_created", "page_id", "created_at"),
    )

    def __repr__(self) -> str:
        return f"<PageVersion(id={self.id}, page_id={self.page_id}, created_at={self.created_at})>"