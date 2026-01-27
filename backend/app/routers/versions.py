"""
Page version endpoints.

Handles:
- Creating version snapshots
- Listing version history
- Viewing specific versions
- Restoring previous versions

All endpoints are nested under /pages/{slug}/versions to maintain
the relationship between pages and their versions.
"""

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from .. import crud, models, schemas
from ..database import get_db
from ..dependencies import get_current_user
from ..exceptions import NotFoundError, BadRequestError, require


router = APIRouter(prefix="/pages/{page_slug}/versions", tags=["Versions"])


def get_page_or_404(
    page_slug: str,
    current_user: models.User,
    db: Session
) -> models.Page:
    """Helper to get page by slug or raise 404."""
    page = crud.get_page_by_slug(db, page_slug, current_user.id)
    return require(page, "Page")


@router.get(
    "",
    response_model=schemas.PageVersionList,
    summary="List page versions"
)
def list_versions(
    page_slug: str,
    limit: int = Query(50, ge=1, le=100, description="Number of versions to return"),
    offset: int = Query(0, ge=0, description="Number of versions to skip"),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get version history for a page.
    
    Returns versions ordered by created_at descending (newest first).
    Includes pagination metadata.
    """
    page = get_page_or_404(page_slug, current_user, db)
    
    versions, total = crud.get_versions_by_page(
        db=db,
        page_id=page.id,
        limit=limit,
        offset=offset
    )
    
    return schemas.PageVersionList(
        versions=[schemas.PageVersionSummary.model_validate(v) for v in versions],
        total=total,
        has_more=(offset + len(versions)) < total
    )


@router.post(
    "",
    response_model=schemas.PageVersion,
    status_code=status.HTTP_201_CREATED,
    summary="Create a version snapshot"
)
def create_version(
    page_slug: str,
    version_data: schemas.PageVersionCreate | None = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new version snapshot of the current page state.
    
    If title/content are provided in the request body, those values
    are used for the version. Otherwise, the current page values are used.
    
    This endpoint is called:
    - Automatically by the frontend on significant changes
    - Manually when the user explicitly saves
    - Before restoring a previous version (as a backup)
    """
    page = get_page_or_404(page_slug, current_user, db)
    
    # Extract optional override values
    title = version_data.title if version_data else None
    content = version_data.content if version_data else None
    
    version = crud.create_version(
        db=db,
        page=page,
        title=title,
        content=content
    )
    
    return version


@router.get(
    "/count",
    response_model=dict,
    summary="Get version count"
)
def get_version_count(
    page_slug: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get the total number of versions for a page.
    
    Useful for displaying version count in the UI without
    fetching the full version list.
    """
    page = get_page_or_404(page_slug, current_user, db)
    
    count = crud.get_version_count(db, page.id)
    
    return {"count": count}


@router.get(
    "/{version_id}",
    response_model=schemas.PageVersion,
    summary="Get a specific version"
)
def get_version(
    page_slug: str,
    version_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific version by ID, including full content.
    
    Used when viewing or comparing versions.
    """
    page = get_page_or_404(page_slug, current_user, db)
    
    version = crud.get_version_by_id(db, version_id, page.id)
    return require(version, "Version")


@router.post(
    "/{version_id}/restore",
    response_model=schemas.Page,
    summary="Restore a previous version"
)
def restore_version(
    page_slug: str,
    version_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Restore the page to a previous version.
    
    This will:
    1. Create a backup version of the current state
    2. Update the page's title and content to match the selected version
    3. Return the updated page
    
    The backup ensures users can always undo a restore operation.
    """
    page = get_page_or_404(page_slug, current_user, db)
    
    version = crud.get_version_by_id(db, version_id, page.id)
    require(version, "Version")
    
    # Restore with backup
    updated_page = crud.restore_version(
        db=db,
        page=page,
        version=version,
        create_backup=True
    )
    
    return updated_page


@router.delete(
    "/{version_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a specific version"
)
def delete_version(
    page_slug: str,
    version_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a specific version from history.
    
    This is useful for cleaning up unwanted snapshots.
    Note: The most recent version cannot be deleted if it's the only one.
    """
    page = get_page_or_404(page_slug, current_user, db)
    
    version = crud.get_version_by_id(db, version_id, page.id)
    require(version, "Version")
    
    crud.delete_version(db=db, version=version)
    return None