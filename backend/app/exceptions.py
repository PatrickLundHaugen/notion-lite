"""
Custom exceptions and error handling.

Uses 404 consistently for "not found OR not authorized" to avoid
leaking information about resource existence.
"""

from fastapi import HTTPException, status


class NotFoundError(HTTPException):
    """Resource not found (or user not authorized to access it)."""
    
    def __init__(self, resource: str = "Resource"):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{resource} not found"
        )


class BadRequestError(HTTPException):
    """Invalid request data."""
    
    def __init__(self, detail: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail
        )


class UnauthorizedError(HTTPException):
    """Authentication required or failed."""
    
    def __init__(self, detail: str = "Could not validate credentials"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"}
        )


class ConflictError(HTTPException):
    """Resource already exists."""
    
    def __init__(self, detail: str):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail
        )


# === Helper Functions ===

def require(resource, resource_name: str = "Resource"):
    """
    Raise 404 if resource is None.
    
    Usage:
        page = require(crud.get_page_by_id(db, page_id, user_id), "Page")
    """
    if resource is None:
        raise NotFoundError(resource_name)
    return resource