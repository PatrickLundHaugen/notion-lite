"""
API Routers package.

Exports all routers for inclusion in the main application.
"""

from .auth import router as auth_router
from .pages import router as pages_router
from .tags import router as tags_router
from .versions import router as versions_router

__all__ = [
    "auth_router",
    "pages_router",
    "tags_router",
    "versions_router",
]