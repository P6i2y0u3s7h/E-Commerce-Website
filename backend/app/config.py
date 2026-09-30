"""
Application configuration using pydantic-settings.
Reads values from environment variables or a .env file.
"""
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

    # Admin creation defaults (override via .env)
    ADMIN_USERNAME: str = "admin"
    ADMIN_EMAIL: str = "admin@example.com"
    ADMIN_PASSWORD: str = "Admin1234!"
    ADMIN_FIRST_NAME: str = "Admin"
    ADMIN_LAST_NAME: str = "User"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
