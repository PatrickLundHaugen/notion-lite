"""
FastAPI application entry point.

This module:
- Creates the FastAPI application
- Configures CORS middleware
- Includes all routers
- Sets up database tables on startup
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import engine
from .models import Base
from .routers import auth_router, pages_router, tags_router, versions_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler.
    Creates database tables on startup.
    """
    # Startup: Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown: Nothing to clean up


def create_app() -> FastAPI:
    """
    Application factory.
    
    Creates and configures the FastAPI application.
    """
    app = FastAPI(
        title="Notes API",
        description="Personal notes and task management API",
        version="2.0.0",
        lifespan=lifespan,
    )
    
    # Configure CORS
    origins = [
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # Create React App
    ]
    
    if settings.client_origin_url:
        origins.append(settings.client_origin_url)
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Include routers
    app.include_router(auth_router)
    app.include_router(pages_router)
    app.include_router(tags_router)
    app.include_router(versions_router)
    
    # Health check endpoint
    @app.get("/health", tags=["Health"])
    def health_check():
        """Health check endpoint for monitoring."""
        return {"status": "healthy"}
    
    return app


# Create app instance
app = create_app()