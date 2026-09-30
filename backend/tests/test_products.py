"""
Tests for product endpoints:
  - GET    /products
  - GET    /products/{id}
  - POST   /products (admin only)
  - PUT    /products/{id} (admin only)
  - DELETE /products/{id} (admin only)
"""
import pytest
from app.models import Product


@pytest.fixture
def sample_product(db):
    """Insert a product directly into the test database."""
    product = Product(
        name="Test Headphones",
        description="Great sound quality",
        price=99.99,
        image_url="https://example.com/headphones.jpg",
        stock_quantity=10,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def test_get_products_empty(client):
    """GET /products returns an empty list when no products exist."""
    response = client.get("/products")
    assert response.status_code == 200
    assert response.json() == []


def test_get_products(client, sample_product):
    """GET /products returns a list containing the seeded product."""
    response = client.get("/products")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Test Headphones"
    assert data[0]["price"] == 99.99


def test_get_product_by_id(client, sample_product):
    """GET /products/{id} returns the correct product."""
    response = client.get(f"/products/{sample_product.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == sample_product.id
    assert data["name"] == "Test Headphones"


def test_get_product_not_found(client):
    """GET /products/9999 returns 404 when product doesn't exist."""
    response = client.get("/products/9999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_admin_create_product(client, admin_token):
    """Admin can create a new product via POST /products."""
    response = client.post(
        "/products",
        json={
            "name": "New Laptop",
            "description": "Powerful laptop for developers",
            "price": 1299.99,
            "image_url": "https://example.com/laptop.jpg",
            "stock_quantity": 25,
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "New Laptop"
    assert data["price"] == 1299.99
    assert data["id"] is not None


def test_customer_cannot_create_product(client, customer_token):
    """Customer gets 403 Forbidden when trying to create a product."""
    response = client.post(
        "/products",
        json={
            "name": "Sneaky Product",
            "description": "Should not be allowed",
            "price": 9.99,
            "stock_quantity": 1,
        },
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert response.status_code == 403


def test_unauthenticated_cannot_create_product(client):
    """Unauthenticated request to POST /products gets 403."""
    response = client.post(
        "/products",
        json={
            "name": "No Auth Product",
            "price": 9.99,
            "stock_quantity": 1,
        },
    )
    assert response.status_code in (401, 403)


def test_admin_update_product(client, admin_token, sample_product):
    """Admin can update an existing product via PUT /products/{id}."""
    response = client.put(
        f"/products/{sample_product.id}",
        json={"price": 149.99, "stock_quantity": 20},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["price"] == 149.99
    assert data["stock_quantity"] == 20
    # Name should remain unchanged
    assert data["name"] == "Test Headphones"


def test_admin_update_product_not_found(client, admin_token):
    """PUT /products/9999 returns 404 when product doesn't exist."""
    response = client.put(
        "/products/9999",
        json={"price": 50.0},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 404


def test_admin_delete_product(client, admin_token, sample_product):
    """Admin can delete a product via DELETE /products/{id}."""
    response = client.delete(
        f"/products/{sample_product.id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 204

    # Verify it's gone
    check = client.get(f"/products/{sample_product.id}")
    assert check.status_code == 404


def test_admin_delete_product_not_found(client, admin_token):
    """DELETE /products/9999 returns 404 when product doesn't exist."""
    response = client.delete(
        "/products/9999",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 404


def test_customer_cannot_delete_product(client, customer_token, sample_product):
    """Customer gets 403 Forbidden when trying to delete a product."""
    response = client.delete(
        f"/products/{sample_product.id}",
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert response.status_code == 403


def test_product_negative_price_rejected(client, admin_token):
    """Creating a product with a negative price returns 422."""
    response = client.post(
        "/products",
        json={
            "name": "Bad Product",
            "price": -10.0,
            "stock_quantity": 5,
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 422
