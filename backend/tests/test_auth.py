"""
Tests for authentication endpoints:
  - POST /auth/register
  - POST /auth/login
  - GET  /auth/me
"""


def test_register_user(client):
    """A new user can register with valid credentials."""
    response = client.post(
        "/auth/register",
        json={
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "SecurePass123",
            "first_name": "New",
            "last_name": "User",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert data["username"] == "newuser"
    assert data["role"] == "CUSTOMER"
    # Ensure password is never returned
    assert "hashed_password" not in data
    assert "password" not in data


def test_register_duplicate_email(client, customer_user):
    """Registering with an existing email returns 409 Conflict."""
    response = client.post(
        "/auth/register",
        json={
            "username": "differentname",
            "email": "customer@test.com",  # already registered
            "password": "SecurePass123",
            "first_name": "Dup",
            "last_name": "Email",
        },
    )
    assert response.status_code == 409
    assert "already registered" in response.json()["detail"]


def test_register_duplicate_username(client, customer_user):
    """Registering with an existing username returns 409 Conflict."""
    response = client.post(
        "/auth/register",
        json={
            "username": "testcustomer",  # already taken
            "email": "different@example.com",
            "password": "SecurePass123",
            "first_name": "Dup",
            "last_name": "Username",
        },
    )
    assert response.status_code == 409
    assert "already taken" in response.json()["detail"]


def test_register_weak_password(client):
    """Registering with a short password returns 422 Validation Error."""
    response = client.post(
        "/auth/register",
        json={
            "username": "weakuser",
            "email": "weak@example.com",
            "password": "123",  # too short
            "first_name": "Weak",
            "last_name": "Pass",
        },
    )
    assert response.status_code == 422


def test_login_success(client, customer_user):
    """A registered user can log in and receives a JWT token."""
    response = client.post(
        "/auth/login",
        json={"email": "customer@test.com", "password": "TestPass123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert len(data["access_token"]) > 0


def test_login_invalid_password(client, customer_user):
    """Login with wrong password returns 401 Unauthorized."""
    response = client.post(
        "/auth/login",
        json={"email": "customer@test.com", "password": "WrongPassword"},
    )
    assert response.status_code == 401
    assert "Invalid" in response.json()["detail"]


def test_login_nonexistent_email(client):
    """Login with unknown email returns 401 Unauthorized."""
    response = client.post(
        "/auth/login",
        json={"email": "nobody@example.com", "password": "AnyPassword"},
    )
    assert response.status_code == 401


def test_get_current_user(client, customer_token):
    """Authenticated user can fetch their own profile."""
    response = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "customer@test.com"
    assert "hashed_password" not in data


def test_protected_endpoint_without_token(client):
    """Accessing /auth/me without a token returns 403 (HTTPBearer raises 403 when no auth header)."""
    response = client.get("/auth/me")
    assert response.status_code in (401, 403)


def test_protected_endpoint_with_invalid_token(client):
    """Accessing /auth/me with a bad token returns 401."""
    response = client.get(
        "/auth/me",
        headers={"Authorization": "Bearer this.is.not.a.valid.token"},
    )
    assert response.status_code == 401
