"""
Database configuration for the e-commerce platform.
Supports SQLite for development and PostgreSQL for production.
Optimized for serverless environments (Vercel) with connection pre-ping and NullPool.
"""
import logging
import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool

from app.config import settings

logger = logging.getLogger("uvicorn.error")

# Determine database URL
db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    # Fix Heroku / Supabase / Neon legacy postgres:// schema for SQLAlchemy
    db_url = db_url.replace("postgres://", "postgresql://", 1)

# Check if running in a serverless environment (e.g., Vercel)
is_serverless = bool(os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"))

if db_url.startswith("sqlite"):
    # In Vercel serverless functions, the root file system is read-only.
    # If DATABASE_URL is left as default SQLite, redirect to /tmp/ so it doesn't crash on boot.
    if is_serverless and ("./ecommerce.db" in db_url or "ecommerce.db" in db_url):
        logger.warning(
            "Running on Vercel with SQLite. Using /tmp/ecommerce.db (ephemeral). "
            "For production persistence, configure DATABASE_URL=postgresql://... in Vercel settings."
        )
        db_url = "sqlite:////tmp/ecommerce.db"

    engine = create_engine(
        db_url,
        connect_args={"check_same_thread": False},
        echo=False,
    )
else:
    # PostgreSQL or other production relational database
    # In serverless, NullPool prevents connection leaks across cold/warm lambdas,
    # and pool_pre_ping=True tests connections to avoid stale socket errors.
    engine = create_engine(
        db_url,
        pool_pre_ping=True,
        poolclass=NullPool,
        echo=False,
    )

# Session factory - each request gets its own session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for all SQLAlchemy models
Base = declarative_base()


def get_db():
    """
    Dependency function that provides a database session.
    Used with FastAPI's Depends() to inject sessions into route handlers.
    The session is always closed after the request completes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
