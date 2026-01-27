"""
Page (notes) endpoints.

Handles:
- Page CRUD operations
- Page hierarchy (parent/child)
- Page tagging
- Page duplication
- Page search
"""

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from .. import crud, models, schemas
from ..database import get_db
from ..dependencies import get_current_user
from ..exceptions import BadRequestError, NotFoundError, require


router = APIRouter(prefix="/pages", tags=["Pages"])


@router.get(
    "",
    response_model=list[schemas.Page],
    summary="List all pages"
)
def list_pages(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all root-level pages for the current user.
    Child pages are nested within their parents.
    """
    return crud.get_pages_by_user(db=db, user_id=current_user.id)


@router.post(
    "",
    response_model=schemas.Page,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new page"
)
def create_page(
    page: schemas.PageCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new page.
    
    Optionally specify parent_id to create as a child page.
    """
    # Validate parent ownership if specified
    if page.parent_id is not None:
        parent = crud.get_page_by_id(db, page.parent_id, current_user.id)
        if parent is None:
            raise NotFoundError("Parent page")
    
    return crud.create_page(db=db, page=page, user_id=current_user.id)


@router.get(
    "/search",
    response_model=list[schemas.Page],
    summary="Search pages"
)
def search_pages(
    q: str = Query(..., min_length=1, max_length=100, description="Search query"),
    limit: int = Query(20, ge=1, le=100),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Search pages by title and content.
    """
    return crud.search_pages(db=db, user_id=current_user.id, query=q, limit=limit)


@router.get(
    "/{page_slug}",
    response_model=schemas.Page,
    summary="Get a specific page"
)
def get_page(
    page_slug: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a page by ID with its children and tags.
    """
    page = crud.get_page_by_slug(db, page_slug, current_user.id)
    return require(page, "Page")


@router.put(
    "/{page_id}",
    response_model=schemas.Page,
    summary="Update a page"
)
def update_page(
    page_id: int,
    page_update: schemas.PageUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update a page's title and/or content.
    """
    page = crud.get_page_by_id(db, page_id, current_user.id)
    require(page, "Page")
    
    return crud.update_page(db=db, page=page, page_update=page_update)


@router.patch(
    "/{page_id}/move",
    response_model=schemas.Page,
    summary="Move a page to a new parent"
)
def move_page(
    page_id: int,
    move: schemas.PageMove,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Move a page to a new parent (or to root if parent_id is null).
    """
    page = crud.get_page_by_id(db, page_id, current_user.id)
    require(page, "Page")
    
    # Validate move operation
    if move.parent_id is not None:
        if move.parent_id == page_id:
            raise BadRequestError("A page cannot be its own parent")
        
        # Check parent exists and belongs to user
        parent = crud.get_page_by_id(db, move.parent_id, current_user.id)
        if parent is None:
            raise NotFoundError("Parent page")
        
        # Prevent circular references (moving to own descendant)
        def is_descendant(potential_parent: models.Page, target_id: int) -> bool:
            if potential_parent.id == target_id:
                return True
            for child in potential_parent.children:
                if is_descendant(child, target_id):
                    return True
            return False
        
        if is_descendant(page, move.parent_id):
            raise BadRequestError("Cannot move a page to one of its descendants")
    
    return crud.update_page_parent(db=db, page=page, parent_id=move.parent_id)


@router.delete(
    "/{page_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a page"
)
def delete_page(
    page_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a page and all its children.
    """
    page = crud.get_page_by_id(db, page_id, current_user.id)
    require(page, "Page")
    
    crud.delete_page(db=db, page=page)
    return None


@router.post(
    "/{page_id}/duplicate",
    response_model=schemas.Page,
    status_code=status.HTTP_201_CREATED,
    summary="Duplicate a page"
)
def duplicate_page(
    page_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a copy of a page with "(Copy)" appended to the title.
    Does not copy child pages.
    """
    page = crud.get_page_by_id(db, page_id, current_user.id)
    require(page, "Page")
    
    return crud.duplicate_page(db=db, page=page, user_id=current_user.id)


# === Tag Operations ===

@router.post(
    "/{page_id}/tags",
    response_model=schemas.Page,
    summary="Add a tag to a page"
)
def add_tag_to_page(
    page_id: int,
    request: schemas.AddTagRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Add a tag to a page.
    
    Either provide tag_id to use an existing tag, or tag_name to find/create one.
    """
    page = crud.get_page_by_id(db, page_id, current_user.id)
    require(page, "Page")
    
    # Get or create tag
    if request.tag_id is not None:
        tag = crud.get_tag_by_id(db, tag_id=request.tag_id, user_id=current_user.id)
        if tag is None:
            raise NotFoundError("Tag")
    elif request.tag_name is not None:
        # Try to find existing tag with this name
        tag = crud.get_tag_by_name(db, name=request.tag_name, user_id=current_user.id)
        if tag is None:
            # Create new tag
            tag_create = schemas.TagCreate(
                name=request.tag_name,
                color=request.tag_color
            )
            tag = crud.create_tag(db=db, tag=tag_create, user_id=current_user.id)
    else:
        raise BadRequestError("Must provide either tag_id or tag_name")
    
    return crud.add_tag_to_page(db=db, page=page, tag=tag)


@router.delete(
    "/{page_id}/tags/{tag_id}",
    response_model=schemas.Page,
    summary="Remove a tag from a page"
)
def remove_tag_from_page(
    page_id: int,
    tag_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Remove a tag from a page.
    """
    page = crud.get_page_by_id(db, page_id, current_user.id)
    require(page, "Page")
    
    tag = crud.get_tag_by_id(db, tag_id=tag_id, user_id=current_user.id)
    require(tag, "Tag")
    
    return crud.remove_tag_from_page(db=db, page=page, tag=tag)