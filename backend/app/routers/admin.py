"""
Admin router: Dashboard analytics, order management, user management, and inventory reports.
Enforces admin-only access on all endpoints.
"""
from datetime import datetime, timedelta, timezone
from typing import List, Optional, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, desc
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.dependencies import get_current_admin
from app.models import User, Product, Order, OrderItem, OrderStatus, UserRole
from app.schemas import (
    AdminStatsResponse,
    AdminUserResponse,
    AdminUserRoleUpdate,
    OrderResponse,
    OrderStatusUpdate,
    ProductResponse,
    MessageResponse,
)

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/stats", response_model=AdminStatsResponse, summary="Get store analytics & dashboard metrics")
def get_admin_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """
    Computes dashboard analytics:
    Total Users, Total Products, Total Orders, Total Revenue, Low Stock Count,
    Pending Orders Count, 7-day revenue/orders charts, top-selling products, and recent orders.
    """
    total_users = db.query(User).count()
    total_products = db.query(Product).count()
    total_orders = db.query(Order).count()

    total_revenue_res = db.query(func.sum(Order.total_amount)).filter(Order.status != OrderStatus.CANCELLED).scalar()
    total_revenue = float(total_revenue_res or 0.0)

    low_stock_count = db.query(Product).filter(Product.stock_quantity <= 10).count()
    pending_orders_count = db.query(Order).filter(Order.status.in_([OrderStatus.PENDING, OrderStatus.CONFIRMED])).count()

    # Revenue and Orders over the last 7 days
    now = datetime.now(timezone.utc)
    revenue_chart = []
    orders_chart = []

    for i in range(6, -1, -1):
        day_start = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        day_label = day_start.strftime("%b %d")

        day_rev = (
            db.query(func.sum(Order.total_amount))
            .filter(
                Order.created_at >= day_start,
                Order.created_at < day_end,
                Order.status != OrderStatus.CANCELLED,
            )
            .scalar()
            or 0.0
        )

        day_orders_count = (
            db.query(Order)
            .filter(Order.created_at >= day_start, Order.created_at < day_end)
            .count()
        )

        revenue_chart.append({"date": day_label, "revenue": round(float(day_rev), 2)})
        orders_chart.append({"date": day_label, "orders": day_orders_count})

    # Top selling products
    top_products_query = (
        db.query(
            Product.id,
            Product.name,
            Product.price,
            Product.image_url,
            Product.category,
            func.sum(OrderItem.quantity).label("units_sold"),
            func.sum(OrderItem.quantity * OrderItem.price_at_purchase).label("total_sales"),
        )
        .join(OrderItem, Product.id == OrderItem.product_id)
        .group_by(Product.id)
        .order_by(desc("units_sold"))
        .limit(5)
        .all()
    )

    top_selling_products = [
        {
            "id": p[0],
            "name": p[1],
            "price": p[2],
            "image_url": p[3],
            "category": p[4],
            "units_sold": int(p[5] or 0),
            "total_sales": round(float(p[6] or 0.0), 2),
        }
        for p in top_products_query
    ]

    # Recent 5 orders
    recent_orders = (
        db.query(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.product))
        .order_by(Order.created_at.desc())
        .limit(5)
        .all()
    )

    return AdminStatsResponse(
        total_users=total_users,
        total_products=total_products,
        total_orders=total_orders,
        total_revenue=round(total_revenue, 2),
        low_stock_products_count=low_stock_count,
        pending_orders_count=pending_orders_count,
        revenue_chart=revenue_chart,
        orders_chart=orders_chart,
        top_selling_products=top_selling_products,
        recent_orders=recent_orders,
    )


@router.get("/orders", response_model=List[OrderResponse], summary="List all store orders (admin)")
def list_all_orders(
    status_filter: Optional[OrderStatus] = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Admin: Paginated list of all customer orders, filterable by status."""
    query = db.query(Order).options(joinedload(Order.items).joinedload(OrderItem.product))
    if status_filter:
        query = query.filter(Order.status == status_filter)

    return query.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()


@router.patch("/orders/{order_id}/status", response_model=OrderResponse, summary="Update order status (admin)")
def update_order_status(
    order_id: int,
    status_update: OrderStatusUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Admin: Transition order status (Pending -> Confirmed -> Processing -> Shipped -> Delivered / Cancelled)."""
    order = (
        db.query(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.product))
        .filter(Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

    old_status = order.status
    new_status = status_update.status

    # If cancelling, replenish stock and refund
    if new_status == OrderStatus.CANCELLED and old_status != OrderStatus.CANCELLED:
        for item in order.items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if product:
                product.stock_quantity += item.quantity
        order.payment_status = "REFUNDED"

    order.status = new_status
    db.commit()
    db.refresh(order)
    return order


@router.get("/users", response_model=List[AdminUserResponse], summary="List registered users (admin)")
def list_all_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Admin: List users with order count and total spend stats."""
    users = db.query(User).order_by(User.created_at.desc()).offset(skip).limit(limit).all()
    results = []

    for u in users:
        order_count = db.query(Order).filter(Order.user_id == u.id).count()
        spent_sum = (
            db.query(func.sum(Order.total_amount))
            .filter(Order.user_id == u.id, Order.status != OrderStatus.CANCELLED)
            .scalar()
            or 0.0
        )
        user_dict = {
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "first_name": u.first_name,
            "last_name": u.last_name,
            "role": u.role,
            "is_active": u.is_active,
            "created_at": u.created_at,
            "updated_at": u.updated_at,
            "order_count": order_count,
            "total_spent": round(float(spent_sum), 2),
        }
        results.append(AdminUserResponse(**user_dict))

    return results


@router.patch("/users/{user_id}/role", response_model=MessageResponse, summary="Update user role or active status (admin)")
def update_user_role(
    user_id: int,
    payload: AdminUserRoleUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Admin: Update user role or toggle active status."""
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    target_user.role = payload.role
    if payload.is_active is not None:
        target_user.is_active = payload.is_active

    db.commit()
    return MessageResponse(message=f"User {target_user.username} updated successfully.")


@router.get("/inventory/low-stock", response_model=List[ProductResponse], summary="List low-stock products (admin)")
def get_low_stock_inventory(
    threshold: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Admin: Retrieve all products where stock_quantity <= threshold."""
    return (
        db.query(Product)
        .filter(Product.stock_quantity <= threshold)
        .order_by(Product.stock_quantity.asc())
        .all()
    )
