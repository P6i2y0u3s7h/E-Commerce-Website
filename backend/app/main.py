"""
FastAPI application entry point.
Configures CORS, includes all modular routers, and initializes database tables safely.
"""
import logging
import os
import sys
from contextlib import asynccontextmanager

# Ensure backend root directory is in sys.path so 'app.*' imports resolve cleanly
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
import app.models  # Register all models with Base
from app.config import settings
from app.routers import (
    auth,
    products,
    orders,
    wishlist,
    reviews,
    addresses,
    coupons,
    admin,
)

logger = logging.getLogger("uvicorn.error")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler.
    Initializes database tables during server startup rather than at module import.
    Gracefully catches errors to avoid crashing serverless cold starts.
    """
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables verified/created successfully.")
    except Exception as exc:
        logger.warning("Could not auto-create database tables on startup: %s", exc)
    yield


class VercelPathMiddleware:
    """
    Middleware for Vercel serverless rewrites:
    When Vercel rewrites incoming traffic to /api/index.py, the ASGI scope['path']
    is set to '/api/index.py' while the true requested path is stored in the
    'x-matched-path' or 'x-forwarded-uri' request header (e.g. '/auth/login', '/health').
    This middleware restores scope['path'] so FastAPI matches the correct route.
    """
    def __init__(self, app, **kwargs):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] in ("http", "websocket"):
            headers = dict(scope.get("headers", []))
            matched_path = headers.get(b"x-matched-path", b"").decode("utf-8")
            if not matched_path:
                matched_path = headers.get(b"x-forwarded-uri", b"").decode("utf-8")

            if matched_path:
                clean_path = matched_path.split("?")[0]
                scope["path"] = clean_path
                scope["raw_path"] = clean_path.encode("utf-8")

        await self.app(scope, receive, send)


app = FastAPI(
    title="ShopWave E-Commerce API",
    description=(
        "A full-stack e-commerce REST API built with FastAPI and SQLAlchemy. "
        "Supports JWT authentication, role-based access control, product search & filtering, "
        "order management, reviews, wishlist, addresses, coupons, and admin analytics."
    ),
    version="2.0.0",
    lifespan=lifespan,
    contact={
        "name": "ShopWave Support",
    },
    license_info={
        "name": "MIT",
    },
)

# ---------------------------------------------------------------------------
# Middlewares
# 1. VercelPathMiddleware: restores true path from Vercel's rewrite header
# 2. CORSMiddleware: allows local development + all Vercel domains via regex
# ---------------------------------------------------------------------------
app.add_middleware(VercelPathMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_origin_regex=r"^https://.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Include Routers — mounted at root (/auth/*, /products/*)
# and also under /api (/api/auth/*, /api/products/*) for flexible proxying
# ---------------------------------------------------------------------------
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(wishlist.router)
app.include_router(reviews.router)
app.include_router(addresses.router)
app.include_router(coupons.router)
app.include_router(admin.router)

api_router = APIRouter(prefix="/api")
api_router.include_router(auth.router)
api_router.include_router(products.router)
api_router.include_router(orders.router)
api_router.include_router(wishlist.router)
api_router.include_router(reviews.router)
api_router.include_router(addresses.router)
api_router.include_router(coupons.router)
api_router.include_router(admin.router)
app.include_router(api_router)


@app.get("/health", tags=["Health"])
@app.get("/api/health", tags=["Health"])
def health():
    """Health check endpoint — confirms the API is running (no auth required)."""
    return {"status": "ok"}


@app.get("/", tags=["Health"])
def health_check():
    """Root endpoint — confirms the API is running."""
    return {
        "status": "ok",
        "message": "ShopWave API v2.0 is running.",
        "docs": "/docs",
    }
