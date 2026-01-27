"""
Database CRUD operations.

All operations that retrieve user resources include owner_id filtering
to ensure users can only access their own data.

Uses eager loading (joinedload) to prevent N+1 query issues.
"""

import secrets
import string

from datetime import datetime, timezone

from sqlalchemy import func, desc
from sqlalchemy.orm import Session, joinedload

from . import models, schemas, security


# === Constants ===

MAX_VERSIONS_PER_PAGE = 50  # Keep last 50 versions per page


# === User Operations ===

def get_user_by_username(db: Session, username: str) -> models.User | None:
    """Get a user by username."""
    return db.query(models.User).filter(models.User.username == username).first()


def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    """Create a new user with hashed password."""
    hashed_password = security.get_password_hash(user.password)
    db_user = models.User(
        username=user.username,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


# === Tag Operations ===

def get_tags_by_user(db: Session, user_id: int) -> list[models.Tag]:
    """
    Get all tags for a user, ordered by usage count (most popular first).
    """
    return (
        db.query(models.Tag)
        .filter(models.Tag.owner_id == user_id)
        .outerjoin(models.page_tags)
        .group_by(models.Tag.id)
        .order_by(
            func.count(models.page_tags.c.page_id).desc(),
            models.Tag.name.asc()
        )
        .all()
    )


def get_tag_by_id(db: Session, tag_id: int, user_id: int) -> models.Tag | None:
    """Get a tag by ID, ensuring it belongs to the user."""
    return (
        db.query(models.Tag)
        .filter(models.Tag.id == tag_id, models.Tag.owner_id == user_id)
        .first()
    )


def get_tag_by_name(db: Session, name: str, user_id: int) -> models.Tag | None:
    """Get a tag by name for a specific user."""
    return (
        db.query(models.Tag)
        .filter(models.Tag.name == name, models.Tag.owner_id == user_id)
        .first()
    )


def create_tag(db: Session, tag: schemas.TagCreate, user_id: int) -> models.Tag:
    """Create a new tag for a user."""
    now = datetime.now(timezone.utc)
    db_tag = models.Tag(
        name=tag.name,
        color=tag.color.value if hasattr(tag.color, 'value') else tag.color,
        owner_id=user_id,
        created_at=now
    )
    db.add(db_tag)
    db.commit()
    db.refresh(db_tag)
    return db_tag


def update_tag(db: Session, tag: models.Tag, tag_update: schemas.TagUpdate) -> models.Tag:
    """Update an existing tag."""
    update_data = tag_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if hasattr(value, 'value'):  # Handle enums
            value = value.value
        setattr(tag, key, value)
    db.commit()
    db.refresh(tag)
    return tag


def delete_tag(db: Session, tag: models.Tag) -> None:
    """Delete a tag (cascade removes from pages)."""
    db.delete(tag)
    db.commit()


# === Page Operations ===

def get_pages_by_user(db: Session, user_id: int) -> list[models.Page]:
    """
    Get all root pages for a user with children and tags eagerly loaded.
    Fixes N+1 query issue by loading relationships in single query.
    """
    return (
        db.query(models.Page)
        .options(
            joinedload(models.Page.tags),
            joinedload(models.Page.children).joinedload(models.Page.tags),
            # Load second level children if needed
            joinedload(models.Page.children)
            .joinedload(models.Page.children)
            .joinedload(models.Page.tags),
        )
        .filter(
            models.Page.owner_id == user_id,
            models.Page.parent_id.is_(None)
        )
        .order_by(models.Page.updated_at.desc())
        .all()
    )


def get_page_by_id(db: Session, page_id: int, user_id: int) -> models.Page | None:
    """
    Get a page by ID, ensuring it belongs to the user.
    Eagerly loads children and tags.
    """
    return (
        db.query(models.Page)
        .options(
            joinedload(models.Page.tags),
            joinedload(models.Page.children).joinedload(models.Page.tags),
        )
        .filter(
            models.Page.id == page_id,
            models.Page.owner_id == user_id
        )
        .first()
    )

def get_page_by_slug(db: Session, slug: str, user_id: int) -> models.Page | None:
    return (
        db.query(models.Page)
        .options(
            joinedload(models.Page.tags),
            joinedload(models.Page.children).joinedload(models.Page.tags),
        )
        .filter(
            models.Page.slug == slug,
            models.Page.owner_id == user_id
        )
        .first()
    )

def generate_slug(length: int = 12) -> str:
    """Generate a URL-safe random slug."""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))


def create_page(db: Session, page: schemas.PageCreate, user_id: int) -> models.Page:
    """Create a new page for a user."""
    now = datetime.now(timezone.utc)
    db_page = models.Page(
        slug=generate_slug(),
        title=page.title,
        content=page.content,
        parent_id=page.parent_id,
        owner_id=user_id,
        created_at=now,
        updated_at=now
    )
    db.add(db_page)
    db.commit()
    db.refresh(db_page)
    return db_page


def update_page(
    db: Session,
    page: models.Page,
    page_update: schemas.PageUpdate
) -> models.Page:
    """Update an existing page."""
    update_data = page_update.model_dump(exclude_unset=True)
    
    if update_data:
        for key, value in update_data.items():
            setattr(page, key, value)
        page.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(page)
    
    return page


def update_page_parent(
    db: Session,
    page: models.Page,
    parent_id: int | None
) -> models.Page:
    """Move a page to a new parent."""
    page.parent_id = parent_id
    page.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(page)
    return page


def delete_page(db: Session, page: models.Page) -> None:
    """Delete a page (cascade deletes children)."""
    db.delete(page)
    db.commit()


def duplicate_page(db: Session, page: models.Page, user_id: int) -> models.Page:
    """Create a copy of an existing page."""
    page_create = schemas.PageCreate(
        title=f"{page.title} (Copy)",
        content=page.content,
        parent_id=page.parent_id
    )
    return create_page(db, page_create, user_id)


def add_tag_to_page(db: Session, page: models.Page, tag: models.Tag) -> models.Page:
    """Add a tag to a page if not already present."""
    if tag not in page.tags:
        page.tags.append(tag)
        page.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(page)
    return page


def remove_tag_from_page(db: Session, page: models.Page, tag: models.Tag) -> models.Page:
    """Remove a tag from a page."""
    if tag in page.tags:
        page.tags.remove(tag)
        page.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(page)
    return page


# === Search Operations (prepared for future use) ===

def search_pages(
    db: Session,
    user_id: int,
    query: str,
    limit: int = 20
) -> list[models.Page]:
    """
    Search pages by title and content.
    Uses case-insensitive LIKE matching.
    """
    search_term = f"%{query}%"
    return (
        db.query(models.Page)
        .options(joinedload(models.Page.tags))
        .filter(
            models.Page.owner_id == user_id,
            (models.Page.title.ilike(search_term)) |
            (models.Page.content.ilike(search_term))
        )
        .order_by(models.Page.updated_at.desc())
        .limit(limit)
        .all()
    )


# === Page Version Operations ===

def get_versions_by_page(
    db: Session,
    page_id: int,
    limit: int = 50,
    offset: int = 0
) -> tuple[list[models.PageVersion], int]:
    """
    Get versions for a page, ordered by created_at descending (newest first).
    Returns tuple of (versions, total_count).
    """
    query = (
        db.query(models.PageVersion)
        .filter(models.PageVersion.page_id == page_id)
        .order_by(desc(models.PageVersion.created_at))
    )
    
    total = query.count()
    versions = query.offset(offset).limit(limit).all()
    
    return versions, total


def get_version_by_id(
    db: Session,
    version_id: int,
    page_id: int
) -> models.PageVersion | None:
    """
    Get a specific version by ID, ensuring it belongs to the page.
    """
    return (
        db.query(models.PageVersion)
        .filter(
            models.PageVersion.id == version_id,
            models.PageVersion.page_id == page_id
        )
        .first()
    )


def get_latest_version(
    db: Session,
    page_id: int
) -> models.PageVersion | None:
    """Get the most recent version for a page."""
    return (
        db.query(models.PageVersion)
        .filter(models.PageVersion.page_id == page_id)
        .order_by(desc(models.PageVersion.created_at))
        .first()
    )


def create_version(
    db: Session,
    page: models.Page,
    title: str | None = None,
    content: str | None = None
) -> models.PageVersion:
    """
    Create a new version snapshot for a page.
    
    If title/content are not provided, uses current page values.
    Automatically cleans up old versions beyond MAX_VERSIONS_PER_PAGE.
    """
    now = datetime.now(timezone.utc)
    
    # Use provided values or fall back to current page values
    version_title = title if title is not None else page.title
    version_content = content if content is not None else page.content
    
    # Calculate content length for stats
    content_length = len(version_content) if version_content else 0
    
    db_version = models.PageVersion(
        page_id=page.id,
        title=version_title,
        content=version_content,
        content_length=content_length,
        created_at=now
    )
    
    db.add(db_version)
    db.commit()
    db.refresh(db_version)
    
    # Clean up old versions
    cleanup_old_versions(db, page.id)
    
    return db_version


def delete_version(db: Session, version: models.PageVersion) -> None:
    """Delete a specific version."""
    db.delete(version)
    db.commit()


def cleanup_old_versions(db: Session, page_id: int) -> int:
    """
    Remove versions beyond MAX_VERSIONS_PER_PAGE.
    Keeps the most recent versions.
    Returns the number of deleted versions.
    """
    # Get IDs of versions to keep (most recent N)
    keep_versions = (
        db.query(models.PageVersion.id)
        .filter(models.PageVersion.page_id == page_id)
        .order_by(desc(models.PageVersion.created_at))
        .limit(MAX_VERSIONS_PER_PAGE)
        .subquery()
    )
    
    # Delete versions not in the keep list
    deleted = (
        db.query(models.PageVersion)
        .filter(
            models.PageVersion.page_id == page_id,
            ~models.PageVersion.id.in_(keep_versions)
        )
        .delete(synchronize_session=False)
    )
    
    if deleted > 0:
        db.commit()
    
    return deleted


def restore_version(
    db: Session,
    page: models.Page,
    version: models.PageVersion,
    create_backup: bool = True
) -> models.Page:
    """
    Restore a page to a previous version.
    
    Args:
        db: Database session
        page: The page to restore
        version: The version to restore to
        create_backup: If True, creates a version of current state before restoring
    
    Returns:
        The updated page
    """
    # Optionally create a backup of current state before restoring
    if create_backup:
        create_version(db, page)
    
    # Restore page to version state
    page.title = version.title
    page.content = version.content
    page.updated_at = datetime.now(timezone.utc)
    
    db.commit()
    db.refresh(page)
    
    return page


def get_version_count(db: Session, page_id: int) -> int:
    """Get the total number of versions for a page."""
    return (
        db.query(func.count(models.PageVersion.id))
        .filter(models.PageVersion.page_id == page_id)
        .scalar()
    )