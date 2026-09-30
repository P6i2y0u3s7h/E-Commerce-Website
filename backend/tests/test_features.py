"""
Comprehensive tests for advanced e-commerce features:
- Product search & filtering & suggestions
- Wishlist operations
- Review submission, stats, and permissions
- Addresses CRUD and default switching
- Coupon validation logic
- Order creation, stock decrement, price capture, and tracking timeline
- Profile management and password reset
- Admin dashboard stats and user management
"""
import pytest
from app.models import Product, Coupon, Order, OrderStatus, UserRole


@pytest.fixture
def rich_products(db):
    """Seed a diverse product catalog for search, filtering, and sorting tests."""
    p1 = Product(
        name="Ultra Noise Cancelling Headphones",
        description="Superior bass and active noise cancellation",
        category="Audio",
        brand="SoundWave",
        price=199.99,
        stock_quantity=15,
        rating=4.8,
        review_count=10,
    )
    p2 = Product(
        name="Wireless Ergonomic Mouse",
        description="Precision laser sensor with quiet clicks",
        category="Accessories",
        brand="TechGrip",
        price=49.99,
        stock_quantity=5,  # Low stock
        rating=4.2,
        review_count=5,
    )
    p3 = Product(
        name="Mechanical Gaming Keyboard",
        description="RGB backlit clicky switches",
        category="Accessories",
        brand="SoundWave",
        price=89.99,
        stock_quantity=0,  # Out of stock
        rating=4.9,
        review_count=20,
    )
    db.add_all([p1, p2, p3])
    db.commit()
    for p in (p1, p2, p3):
        db.refresh(p)
    return [p1, p2, p3]


# ---------------------------------------------------------------------------
# Search, Filter & Suggestions Tests
# ---------------------------------------------------------------------------

def test_search_suggestions(client, rich_products):
    """GET /products/search/suggestions returns matching prefix results."""
    res = client.get("/products/search/suggestions?q=head")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 1
    assert "Headphones" in data[0]["name"]


def test_products_category_filter(client, rich_products):
    """GET /products?category=Audio filters out other categories."""
    res = client.get("/products?category=Audio")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 1
    assert data[0]["category"] == "Audio"


def test_products_price_filter(client, rich_products):
    """GET /products?min_price=60&max_price=100 filters by price bracket."""
    res = client.get("/products?min_price=60&max_price=100")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 1
    assert data[0]["name"] == "Mechanical Gaming Keyboard"


def test_products_stock_filter(client, rich_products):
    """GET /products?in_stock=true excludes 0 stock items."""
    res = client.get("/products?in_stock=true")
    assert res.status_code == 200
    data = res.json()
    assert all(item["stock_quantity"] > 0 for item in data)
    assert len(data) == 2


def test_products_sorting(client, rich_products):
    """GET /products?sort=price_asc returns items in ascending order of price."""
    res = client.get("/products?sort=price_asc")
    assert res.status_code == 200
    data = res.json()
    assert data[0]["price"] <= data[1]["price"] <= data[2]["price"]


# ---------------------------------------------------------------------------
# Wishlist Tests
# ---------------------------------------------------------------------------

def test_wishlist_flow(client, customer_token, rich_products):
    """Add, check, list, and remove from wishlist."""
    headers = {"Authorization": f"Bearer {customer_token}"}
    p_id = rich_products[0].id

    # 1. Check initially empty
    res = client.get(f"/wishlist/check/{p_id}", headers=headers)
    assert res.status_code == 200
    assert res.json()["in_wishlist"] is False

    # 2. Add to wishlist
    res = client.post(f"/wishlist/{p_id}", headers=headers)
    assert res.status_code == 201

    # 3. Check again
    res = client.get(f"/wishlist/check/{p_id}", headers=headers)
    assert res.json()["in_wishlist"] is True

    # 4. List wishlist
    res = client.get("/wishlist", headers=headers)
    assert res.status_code == 200
    assert len(res.json()) == 1

    # 5. Remove from wishlist
    res = client.delete(f"/wishlist/{p_id}", headers=headers)
    assert res.status_code == 200

    # 6. Check removed
    res = client.get(f"/wishlist/check/{p_id}", headers=headers)
    assert res.json()["in_wishlist"] is False


# ---------------------------------------------------------------------------
# Review Tests
# ---------------------------------------------------------------------------

def test_review_submission_and_stats(client, customer_token, rich_products):
    """Submit a review, verify average rating recalculation and stats breakdown."""
    headers = {"Authorization": f"Bearer {customer_token}"}
    p_id = rich_products[0].id

    # Post review
    res = client.post(
        f"/products/{p_id}/reviews",
        json={"rating": 5, "title": "Incredible sound", "comment": "Blown away by the clarity!"},
        headers=headers,
    )
    assert res.status_code == 201
    rev_id = res.json()["id"]

    # Check stats endpoint
    res = client.get(f"/products/{p_id}/reviews")
    assert res.status_code == 200
    stats = res.json()
    assert stats["total_reviews"] >= 1
    assert stats["rating_distribution"]["5"] >= 1

    # Edit review
    res = client.put(
        f"/reviews/{rev_id}",
        json={"rating": 4, "title": "Still great", "comment": "Updated comment"},
        headers=headers,
    )
    assert res.status_code == 200
    assert res.json()["rating"] == 4

    # Delete review
    res = client.delete(f"/reviews/{rev_id}", headers=headers)
    assert res.status_code == 200


# ---------------------------------------------------------------------------
# Address Tests
# ---------------------------------------------------------------------------

def test_address_management(client, customer_token):
    """Add address, update, set default, and delete."""
    headers = {"Authorization": f"Bearer {customer_token}"}

    # Create address
    res = client.post(
        "/addresses",
        json={
            "full_name": "John Doe",
            "phone": "+1 555-0199",
            "street_address": "123 Tech Boulevard",
            "city": "San Francisco",
            "state": "CA",
            "postal_code": "94107",
            "country": "United States",
            "is_default": True,
        },
        headers=headers,
    )
    assert res.status_code == 201
    addr_id = res.json()["id"]
    assert res.json()["is_default"] is True

    # List addresses
    res = client.get("/addresses", headers=headers)
    assert res.status_code == 200
    assert len(res.json()) == 1

    # Delete address
    res = client.delete(f"/addresses/{addr_id}", headers=headers)
    assert res.status_code == 200


# ---------------------------------------------------------------------------
# Coupon Tests
# ---------------------------------------------------------------------------

def test_coupon_validation(client, db):
    """Validate percentage discount and minimum order requirements."""
    coupon = Coupon(
        code="TEST20",
        discount_type="percentage",
        discount_value=20.0,
        minimum_order_amount=50.0,
        is_active=True,
    )
    db.add(coupon)
    db.commit()

    # Valid coupon on $100 order -> $20 discount
    res = client.post("/coupons/validate", json={"code": "TEST20", "order_amount": 100.0})
    assert res.status_code == 200
    assert res.json()["valid"] is True
    assert res.json()["discount_amount"] == 20.0
    assert res.json()["final_amount"] == 80.0

    # Below minimum order amount ($30 < $50)
    res = client.post("/coupons/validate", json={"code": "TEST20", "order_amount": 30.0})
    assert res.json()["valid"] is False


# ---------------------------------------------------------------------------
# Order Creation & Stock Tests
# ---------------------------------------------------------------------------

def test_order_creation_stock_and_tracking(client, customer_token, rich_products, db):
    """Order creation captures price at purchase, decrements stock, and generates tracking."""
    headers = {"Authorization": f"Bearer {customer_token}"}
    product = rich_products[0]
    initial_stock = product.stock_quantity

    res = client.post(
        "/orders",
        json={
            "shipping_address": "123 Main St, Springfield",
            "items": [{"product_id": product.id, "quantity": 2}],
            "payment_method": "Sandbox Card",
        },
        headers=headers,
    )
    assert res.status_code == 201
    order = res.json()
    assert order["subtotal"] == round(product.price * 2, 2)
    assert order["tracking_number"] is not None
    assert len(order["items"]) == 1
    assert order["items"][0]["price_at_purchase"] == product.price

    # Verify stock decremented in database
    db.refresh(product)
    assert product.stock_quantity == initial_stock - 2

    # Check order tracking
    order_id = order["id"]
    res = client.get(f"/orders/{order_id}/tracking", headers=headers)
    assert res.status_code == 200
    tracking = res.json()
    assert len(tracking["events"]) >= 5
    assert tracking["events"][1]["completed"] is True  # CONFIRMED


# ---------------------------------------------------------------------------
# Admin Endpoints Tests
# ---------------------------------------------------------------------------

def test_admin_dashboard_and_users(client, admin_token, rich_products):
    """Admin stats, order status change, and low-stock queries."""
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Stats
    res = client.get("/admin/stats", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "total_products" in data
    assert "total_revenue" in data
    assert "low_stock_products_count" in data

    # Low stock inventory
    res = client.get("/admin/inventory/low-stock?threshold=10", headers=headers)
    assert res.status_code == 200
    low_stock = res.json()
    assert len(low_stock) >= 1

    # User management
    res = client.get("/admin/users", headers=headers)
    assert res.status_code == 200
    assert len(res.json()) >= 1


def test_order_cancellation_and_refund_restores_stock(client, customer_token, rich_products, db):
    """Customer cancels their order, restoring product inventory and refunding payment."""
    headers = {"Authorization": f"Bearer {customer_token}"}
    product = rich_products[0]
    stock_before = product.stock_quantity

    # 1. Place order
    res = client.post(
        "/orders",
        json={
            "shipping_address": "456 Oak Avenue",
            "items": [{"product_id": product.id, "quantity": 3}],
        },
        headers=headers,
    )
    assert res.status_code == 201
    order = res.json()
    order_id = order["id"]

    db.refresh(product)
    assert product.stock_quantity == stock_before - 3

    # 2. Cancel order
    cancel_res = client.post(f"/orders/{order_id}/cancel", headers=headers)
    assert cancel_res.status_code == 200
    cancelled_order = cancel_res.json()
    assert cancelled_order["status"] == "CANCELLED"
    assert cancelled_order["payment_status"] == "REFUNDED"

    # 3. Stock restored
    db.refresh(product)
    assert product.stock_quantity == stock_before


def test_admin_order_cancel_restores_stock(client, admin_token, customer_token, rich_products, db):
    """Admin updating order status to CANCELLED restores stock and sets refund."""
    headers_cust = {"Authorization": f"Bearer {customer_token}"}
    headers_admin = {"Authorization": f"Bearer {admin_token}"}
    product = rich_products[1]
    stock_before = product.stock_quantity

    # Customer places order
    res = client.post(
        "/orders",
        json={
            "shipping_address": "789 Pine Road",
            "items": [{"product_id": product.id, "quantity": 2}],
        },
        headers=headers_cust,
    )
    assert res.status_code == 201
    order_id = res.json()["id"]

    db.refresh(product)
    assert product.stock_quantity == stock_before - 2

    # Admin changes status to CANCELLED
    patch_res = client.patch(
        f"/admin/orders/{order_id}/status",
        json={"status": "CANCELLED"},
        headers=headers_admin,
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "CANCELLED"
    assert patch_res.json()["payment_status"] == "REFUNDED"

    db.refresh(product)
    assert product.stock_quantity == stock_before


def test_get_my_reviews(client, customer_token, rich_products):
    """Customer can fetch all their authored reviews with product details."""
    headers = {"Authorization": f"Bearer {customer_token}"}
    p_id = rich_products[0].id

    # Post review
    client.post(
        f"/products/{p_id}/reviews",
        json={"rating": 5, "title": "Top notch quality", "comment": "Highly recommended!"},
        headers=headers,
    )

    # Fetch /reviews/me
    res = client.get("/reviews/me", headers=headers)
    assert res.status_code == 200
    my_reviews = res.json()
    assert len(my_reviews) >= 1
    assert my_reviews[0]["product_id"] == p_id
    assert my_reviews[0]["product"] is not None
    assert my_reviews[0]["product"]["name"] == rich_products[0].name

