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
    is often set to '/api/index.py' while the client's actual requested path is in
    'x-forwarded-uri', 'x-original-uri', or 'x-invoke-path'.
    This middleware restores scope['path'] and query parameters so FastAPI matches the correct route.
    """
    def __init__(self, app, **kwargs):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] in ("http", "websocket"):
            headers = dict(scope.get("headers", []))
            
            # Check headers that Vercel uses to carry the client's original requested URI
            candidates = [
                headers.get(b"x-forwarded-uri", b"").decode("utf-8"),
                headers.get(b"x-original-uri", b"").decode("utf-8"),
                headers.get(b"x-invoke-path", b"").decode("utf-8"),
                headers.get(b"x-matched-path", b"").decode("utf-8"),
            ]
            
            chosen_path = None
            query_str = None
            for cand in candidates:
                if cand:
                    parts = cand.split("?", 1)
                    clean = parts[0].strip()
                    # Ignore internal serverless file destinations (e.g. /api/index.py)
                    if clean and not clean.startswith("/api/index") and not clean.endswith(".py"):
                        chosen_path = clean
                        if len(parts) > 1:
                            query_str = parts[1]
                        break
            
            if not chosen_path:
                current_path = scope.get("path", "")
                if current_path and not current_path.startswith("/api/index") and not current_path.endswith(".py"):
                    chosen_path = current_path
            
            if chosen_path:
                scope["path"] = chosen_path
                scope["raw_path"] = chosen_path.encode("utf-8")
            
            if query_str and not scope.get("query_string"):
                scope["query_string"] = query_str.encode("utf-8")

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
    allow_origin_regex=r"^(http://(localhost|127\.0\.0\.1)(:\d+)?|https://.*\.vercel\.app)$",
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


from fastapi import Request

@app.get("/", tags=["Health"])
@app.get("/api/index.py", tags=["Health"], include_in_schema=False)
@app.get("/api/index", tags=["Health"], include_in_schema=False)
def health_check(request: Request):
    """Root endpoint — confirms the API is running."""
    # Collect all headers and relevant scope keys for diagnostics
    header_dict = dict(request.headers)
    return {
        "status": "ok",
        "message": "ShopWave API v2.0 is running.",
        "docs": "/docs",
        "debug_scope_path": request.scope.get("path"),
        "debug_headers": header_dict,
        "debug_scope_keys": [k for k in request.scope.keys() if k != "app"],
    }


