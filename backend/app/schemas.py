"""
Pydantic schemas for request/response validation.

All schemas include:
- Field length constraints to prevent abuse
- Proper type validation
- Enum constraints where applicable
"""

from datetime import datetime
from enum import Enum
import re

from pydantic import BaseModel, Field, field_validator, field_serializer


# === Enums ===
class TagColor(str, Enum):
    """Predefined tag colors."""
    GRAY = "gray"
    RED = "red"
    ORANGE = "orange"
    YELLOW = "yellow"
    GREEN = "green"
    BLUE = "blue"
    PURPLE = "purple"
    CYAN = "cyan"


# === Tag Schemas ===

class TagBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    color: TagColor = TagColor.GRAY


class TagCreate(TagBase):
    pass


class TagUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=50)
    color: TagColor | None = None


class Tag(TagBase):
    id: int
    owner_id: int
    created_at: datetime

    @field_serializer("created_at")
    def serialize_datetime(self, dt: datetime) -> str | None:
        return dt.isoformat() + "Z" if dt else None

    @field_serializer("color")
    def serialize_color(self, color: TagColor) -> str:
        return color.value

    class Config:
        from_attributes = True


# === Page Schemas ===

class PageBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    content: str | None = Field(None, max_length=500_000)  # ~500KB limit


class PageCreate(PageBase):
    parent_id: int | None = None


class PageUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=500)
    content: str | None = Field(None, max_length=500_000)


class PageMove(BaseModel):
    """Request body for moving a page to a new parent."""
    parent_id: int | None = None


class Page(PageBase):
    id: int
    slug: str
    owner_id: int
    parent_id: int | None = None
    created_at: datetime
    updated_at: datetime
    children: list["Page"] = []
    tags: list[Tag] = []

    @field_serializer("created_at", "updated_at")
    def serialize_datetime(self, dt: datetime) -> str | None:
        return dt.isoformat() + "Z" if dt else None

    class Config:
        from_attributes = True


# === Page Version Schemas ===

class PageVersionBase(BaseModel):
    """Base schema for page versions."""
    title: str
    content: str | None = None


class PageVersionCreate(BaseModel):
    """
    Request body for creating a version.
    Content is optional - if not provided, current page content is used.
    """
    title: str | None = None
    content: str | None = None


class PageVersionSummary(BaseModel):
    """
    Summary of a version for list views.
    Does not include full content to keep responses light.
    """
    id: int
    page_id: int
    title: str
    content_length: int
    created_at: datetime

    @field_serializer("created_at")
    def serialize_datetime(self, dt: datetime) -> str | None:
        return dt.isoformat() + "Z" if dt else None

    class Config:
        from_attributes = True


class PageVersion(PageVersionBase):
    """Full version including content."""
    id: int
    page_id: int
    content_length: int
    created_at: datetime

    @field_serializer("created_at")
    def serialize_datetime(self, dt: datetime) -> str | None:
        return dt.isoformat() + "Z" if dt else None

    class Config:
        from_attributes = True


class PageVersionList(BaseModel):
    """Paginated list of versions."""
    versions: list[PageVersionSummary]
    total: int
    has_more: bool


# === User Schemas ===

class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        if not re.match(r"^[a-zA-Z0-9_-]+$", v):
            raise ValueError("Username must contain only letters, numbers, underscores, and hyphens")
        return v.lower()  # Normalize to lowercase


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=128)


class User(UserBase):
    id: int
    pages: list[Page] = []
    tags: list[Tag] = []

    class Config:
        from_attributes = True


class UserPublic(UserBase):
    """Public user info without relationships (for lighter responses)."""
    id: int

    class Config:
        from_attributes = True


# === Auth Schemas ===

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenRefresh(BaseModel):
    access_token: str
    token_type: str = "bearer"


# === Shared Request Schemas ===

class AddTagRequest(BaseModel):
    """Request to add a tag by ID or create a new one by name."""
    tag_id: int | None = None
    tag_name: str | None = Field(None, min_length=1, max_length=50)
    tag_color: TagColor = TagColor.GRAY

    @field_validator("tag_name", "tag_id")
    @classmethod
    def at_least_one_required(cls, v, info):
        # This runs for each field; we validate in the endpoint
        return v


# Rebuild models to resolve forward references
Page.model_rebuild()
User.model_rebuild()