"""
Application configuration using pydantic-settings.
Reads values from environment variables or a .env file.
"""
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    All values can be overridden via a .env file.
    """
    DATABASE_URL: str = "sqlite:///./ecommerce.db"
    SECRET_KEY: str = "change-this-to-a-very-long-random-secret-key-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # CORS — comma-separated list of allowed frontend origins.
    # Includes local dev (5173), Vite preview (4173), alternative dev (3000), and production domains
    CORS_ORIGINS: str = (
        "http://localhost:5173,http://127.0.0.1:5173,"
        "http://localhost:4173,http://127.0.0.1:4173,"
        "http://localhost:3000,http://127.0.0.1:3000,"
        "http://localhost:8000,http://127.0.0.1:8000,"
        "https://e-commerce-website-6qq9.vercel.app,"
        "https://e-commerce-website-one-phi-12.vercel.app"
    )

    # Admin creation defaults (override via .env)
    ADMIN_USERNAME: str = "admin"
    ADMIN_EMAIL: str = "admin@example.com"
    ADMIN_PASSWORD: str = "Admin1234!"
    ADMIN_FIRST_NAME: str = "Admin"
    ADMIN_LAST_NAME: str = "User"

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse the comma-separated CORS_ORIGINS string into a list without trailing slashes."""
        origins = [origin.strip().rstrip("/") for origin in self.CORS_ORIGINS.split(",") if origin.strip()]
        # Always allow all standard local dev, preview, and deployed frontend origins
        default_origins = [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:4173",
            "http://127.0.0.1:4173",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:8000",
            "http://127.0.0.1:8000",
            "https://e-commerce-website-6qq9.vercel.app",
            "https://e-commerce-website-one-phi-12.vercel.app",
        ]
        for dev_url in default_origins:
            if dev_url not in origins:
                origins.append(dev_url)
        return origins

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
