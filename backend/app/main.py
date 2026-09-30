"""
FastAPI application entry point.
Configures CORS, includes all modular routers, and creates database tables on startup.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
import app.models  # Register all models with Base
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

# Create all database tables (safe to call multiple times)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ShopWave E-Commerce API",
    description=(
        "A full-stack e-commerce REST API built with FastAPI and SQLAlchemy. "
        "Supports JWT authentication, role-based access control, product search & filtering, "
        "order management, reviews, wishlist, addresses, coupons, and admin analytics."
    ),
    version="2.0.0",
    contact={
        "name": "ShopWave Support",
        "url": "http://localhost:5173",
    },
    license_info={
        "name": "MIT",
    },
)

# ---------------------------------------------------------------------------
# CORS Configuration
# Allow frontend dev servers and previews
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Include Routers
# ---------------------------------------------------------------------------
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(wishlist.router)
app.include_router(reviews.router)
app.include_router(addresses.router)
app.include_router(coupons.router)
app.include_router(admin.router)


@app.get("/", tags=["Health"])
def health_check():
    """Health check endpoint — confirms the API is running."""
    return {
        "status": "ok",
        "message": "ShopWave API v2.0 is running.",
        "docs": "/docs",
    }
