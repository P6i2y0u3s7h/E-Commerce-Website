"""
create_admin.py — Admin user creation script.

Run this from the backend/ directory:
    python create_admin.py

Reads credentials from environment variables (or .env file).
Safe to run multiple times — skips if admin already exists.
"""
import sys
import os

# Allow running from the backend/ directory
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine, Base
from app.models import User, UserRole
from app.security import hash_password
from app.config import settings

# Create tables if they don't exist yet
Base.metadata.create_all(bind=engine)


def create_admin():
    """Create an admin user using credentials from environment variables."""
    db = SessionLocal()

    try:
        # Check whether admin already exists (by email or username)
        existing = (
            db.query(User)
            .filter(
                (User.email == settings.ADMIN_EMAIL)
                | (User.username == settings.ADMIN_USERNAME)
            )
            .first()
        )

        if existing:
            print(f"[INFO] Admin user already exists: {existing.email} (role={existing.role})")
            return

        # Create admin user
        admin = User(
            username=settings.ADMIN_USERNAME,
            email=settings.ADMIN_EMAIL,
            hashed_password=hash_password(settings.ADMIN_PASSWORD),
            first_name=settings.ADMIN_FIRST_NAME,
            last_name=settings.ADMIN_LAST_NAME,
            role=UserRole.ADMIN,
        )

        db.add(admin)
        db.commit()
        db.refresh(admin)

        print("[OK] Admin user created successfully!")
        print(f"   Username : {admin.username}")
        print(f"   Email    : {admin.email}")
        print(f"   Role     : {admin.role}")
        print("\n[NOTE] Remember to change the default password in production!")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Error creating admin: {e}")
        raise

    finally:
        db.close()


if __name__ == "__main__":
    print("[INFO] Creating admin user...\n")
    create_admin()
