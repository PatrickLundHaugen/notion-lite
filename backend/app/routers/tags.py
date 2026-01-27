"""
Tag endpoints.

Handles tag CRUD operations.
Tags are automatically removed from pages/tasks when deleted (via cascade).
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from .. import crud, models, schemas
from ..database import get_db
from ..dependencies import get_current_user
from ..exceptions import BadRequestError, require


router = APIRouter(prefix="/tags", tags=["Tags"])


@router.get(
    "",
    response_model=list[schemas.Tag],
    summary="List all tags"
)
def list_tags(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all tags for the current user.
    
    Tags are ordered by usage count (most used first).
    """
    return crud.get_tags_by_user(db=db, user_id=current_user.id)


@router.post(
    "",
    response_model=schemas.Tag,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new tag"
)
def create_tag(
    tag: schemas.TagCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new tag.
    
    Tag names must be unique per user.
    """
    existing_tag = crud.get_tag_by_name(db, name=tag.name, user_id=current_user.id)
    if existing_tag:
        raise BadRequestError("Tag with this name already exists")
    
    return crud.create_tag(db=db, tag=tag, user_id=current_user.id)


@router.get(
    "/{tag_id}",
    response_model=schemas.Tag,
    summary="Get a specific tag"
)
def get_tag(
    tag_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a tag by ID.
    """
    tag = crud.get_tag_by_id(db, tag_id, current_user.id)
    return require(tag, "Tag")


@router.put(
    "/{tag_id}",
    response_model=schemas.Tag,
    summary="Update a tag"
)
def update_tag(
    tag_id: int,
    tag_update: schemas.TagUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update a tag's name and/or color.
    """
    tag = crud.get_tag_by_id(db, tag_id, current_user.id)
    tag = require(tag, "Tag")
    
    # Check for duplicate name if updating name
    if tag_update.name and tag_update.name != tag.name:
        existing_tag = crud.get_tag_by_name(
            db, name=tag_update.name, user_id=current_user.id
        )
        if existing_tag:
            raise BadRequestError("Tag with this name already exists")
    
    return crud.update_tag(db=db, tag=tag, tag_update=tag_update)


@router.delete(
    "/{tag_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a tag"
)
def delete_tag(
    tag_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a tag.
    
    The tag is automatically removed from all pages and tasks.
    """
    tag = crud.get_tag_by_id(db, tag_id, current_user.id)
    require(tag, "Tag")
    
    crud.delete_tag(db=db, tag=tag)
    return None