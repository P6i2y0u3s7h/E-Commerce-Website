"""
Shared pytest fixtures for all tests.
Uses an in-memory SQLite database for isolation — no real files created.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.models import User, UserRole
from app.security import hash_password

# Use an in-memory SQLite database for tests — fast and isolated
TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    """Override the database dependency to use the test database."""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def setup_database():
    """Create all tables before each test, drop them after."""
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def client():
    """Provide a test client with the test database override."""
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def db():
    """Provide a direct database session for fixtures."""
    database = TestingSessionLocal()
    try:
        yield database
    finally:
        database.close()


@pytest.fixture
def customer_user(db):
    """Create a sample customer user for testing."""
    user = User(
        username="testcustomer",
        email="customer@test.com",
        hashed_password=hash_password("TestPass123"),
        first_name="Test",
        last_name="Customer",
        role=UserRole.CUSTOMER,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def admin_user(db):
    """Create a sample admin user for testing."""
    user = User(
        username="testadmin",
        email="admin@test.com",
        hashed_password=hash_password("AdminPass123"),
        first_name="Test",
        last_name="Admin",
        role=UserRole.ADMIN,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def customer_token(client, customer_user):
    """Log in as the customer and return a JWT token."""
    response = client.post(
        "/auth/login",
        json={"email": "customer@test.com", "password": "TestPass123"},
    )
    return response.json()["access_token"]


@pytest.fixture
def admin_token(client, admin_user):
    """Log in as the admin and return a JWT token."""
    response = client.post(
        "/auth/login",
        json={"email": "admin@test.com", "password": "AdminPass123"},
    )
    return response.json()["access_token"]
