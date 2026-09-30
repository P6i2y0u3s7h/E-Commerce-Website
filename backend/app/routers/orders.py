"""
Orders router: Order creation, history, details, and tracking timeline.
Enforces transactional stock verification, price capture, and coupon deduction.
"""
from datetime import datetime, timezone, timedelta
import random
import string
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Order, OrderItem, Product, Coupon, User, OrderStatus, UserRole
from app.schemas import (
    OrderCreate,
    OrderResponse,
    OrderTrackingResponse,
    TrackingEvent,
)

router = APIRouter(prefix="/orders", tags=["Orders"])


def _generate_tracking_number(order_id: int) -> str:
    """Generate a realistic mock courier tracking number."""
    rand_suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"SW-{order_id:04d}-{rand_suffix}"


@router.post(
    "",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new order from cart",
)
def create_order(
    order_data: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Transactional order creation:
    1. Verify products and check inventory.
    2. Capture current price_at_purchase.
    3. Apply validated coupon discount if provided.
    4. Calculate shipping and final total.
    5. Decrement product stock atomically.
    6. Record order and line items.
    """
    if not order_data.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order must contain at least one item.",
        )

    subtotal = 0.0
    items_to_create = []

    # 1. Validate stock & capture price
    for item_req in order_data.items:
        product = db.query(Product).filter(Product.id == item_req.product_id).with_for_update().first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product id={item_req.product_id} not found.",
            )

        if product.stock_quantity < item_req.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for '{product.name}'. Only {product.stock_quantity} available.",
            )

        # Decrement stock atomically
        product.stock_quantity -= item_req.quantity
        item_total = round(product.price * item_req.quantity, 2)
        subtotal += item_total

        items_to_create.append(
            OrderItem(
                product_id=product.id,
                quantity=item_req.quantity,
                price_at_purchase=product.price,
            )
        )

    subtotal = round(subtotal, 2)

    # 2. Coupon discount calculation
    discount_amount = 0.0
    applied_coupon_code = None

    if order_data.coupon_code and order_data.coupon_code.strip():
        code = order_data.coupon_code.strip().upper()
        coupon = db.query(Coupon).filter(Coupon.code == code).first()
        if coupon and coupon.is_active:
            now = datetime.now(timezone.utc)
            exp = coupon.expiration_date
            if exp and exp.tzinfo is None:
                exp = exp.replace(tzinfo=timezone.utc)

            valid_expiry = exp is None or now <= exp
            valid_usage = coupon.usage_limit is None or coupon.used_count < coupon.usage_limit
            valid_min = subtotal >= coupon.minimum_order_amount

            if valid_expiry and valid_usage and valid_min:
                if coupon.discount_type == "percentage":
                    discount_amount = round((coupon.discount_value / 100.0) * subtotal, 2)
                else:
                    discount_amount = round(min(coupon.discount_value, subtotal), 2)
                coupon.used_count += 1
                applied_coupon_code = coupon.code

    # 3. Shipping fee calculation (e.g. Free shipping above ₹500, otherwise ₹50)
    shipping_fee = 0.0 if subtotal >= 100.0 else (9.99 if subtotal > 0 else 0.0)
    total_amount = max(0.0, round(subtotal - discount_amount + shipping_fee, 2))

    # Estimated delivery date: 4 calendar days from order placement
    now = datetime.now(timezone.utc)
    estimated_delivery = now + timedelta(days=4)

    # 4. Create Order
    new_order = Order(
        user_id=current_user.id,
        subtotal=subtotal,
        discount_amount=discount_amount,
        shipping_fee=shipping_fee,
        total_amount=total_amount,
        coupon_code=applied_coupon_code,
        status=OrderStatus.CONFIRMED,
        shipping_address=order_data.shipping_address,
        payment_method=order_data.payment_method or "Sandbox Credit Card",
        payment_status="PAID",
        tracking_number=None,
        estimated_delivery=estimated_delivery,
        contact_email=order_data.contact_email or current_user.email,
        contact_phone=order_data.contact_phone,
        notes=order_data.notes,
        items=items_to_create,
    )

    db.add(new_order)
    db.flush()

    new_order.tracking_number = _generate_tracking_number(new_order.id)
    db.commit()
    db.refresh(new_order)

    return new_order


@router.get("", response_model=List[OrderResponse], summary="Get customer's orders")
def get_user_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all orders placed by the current authenticated user."""
    orders = (
        db.query(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.product))
        .filter(Order.user_id == current_user.id)
        .order_by(Order.created_at.desc())
        .all()
    )
    return orders


@router.get("/{order_id}", response_model=OrderResponse, summary="Get single order details")
def get_order_details(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve single order details. Enforces user ownership or admin permission."""
    order = (
        db.query(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.product))
        .filter(Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

    if order.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    return order


@router.get("/{order_id}/tracking", response_model=OrderTrackingResponse, summary="Get order tracking timeline")
def get_order_tracking(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns visual timeline progression for order tracking:
    Placed -> Confirmed -> Processing -> Shipped -> Delivered
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

    if order.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    all_statuses = [
        ("PENDING", "Order Placed"),
        ("CONFIRMED", "Confirmed"),
        ("PROCESSING", "Processing & Packaging"),
        ("SHIPPED", "Shipped & In Transit"),
        ("DELIVERED", "Delivered"),
    ]

    status_weights = {
        OrderStatus.PENDING: 0,
        OrderStatus.CONFIRMED: 1,
        OrderStatus.PROCESSING: 2,
        OrderStatus.SHIPPED: 3,
        OrderStatus.DELIVERED: 4,
        OrderStatus.CANCELLED: -1,
    }

    current_weight = status_weights.get(order.status, 0)
    events: List[TrackingEvent] = []

    if order.status == OrderStatus.CANCELLED:
        events.append(
            TrackingEvent(
                status="CANCELLED",
                label="Order Cancelled",
                completed=True,
                current=True,
                timestamp=order.updated_at or order.created_at,
            )
        )
    else:
        for idx, (st_code, label) in enumerate(all_statuses):
            completed = idx <= current_weight
            current = idx == current_weight
            ts = order.created_at if idx == 0 else (order.updated_at if current else None)
            events.append(
                TrackingEvent(
                    status=st_code,
                    label=label,
                    completed=completed,
                    current=current,
                    timestamp=ts,
                )
            )

    return OrderTrackingResponse(
        order_id=order.id,
        status=order.status,
        tracking_number=order.tracking_number,
        events=events,
    )


@router.post(
    "/{order_id}/cancel",
    response_model=OrderResponse,
    summary="Cancel order and process refund with stock replenishment",
)
def cancel_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Cancel an order:
    1. Verify user ownership (or admin permission).
    2. Check status is eligible for cancellation (PENDING, CONFIRMED, PROCESSING).
    3. Return purchased item quantities back to product stock.
    4. Set status to CANCELLED and payment_status to REFUNDED.
    """
    order = (
        db.query(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.product))
        .filter(Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

    if order.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    if order.status == OrderStatus.CANCELLED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order is already cancelled.",
        )

    if order.status in [OrderStatus.SHIPPED, OrderStatus.DELIVERED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel order with status '{order.status.value}'. Please contact customer support for returns.",
        )

    # Replenish stock
    for item in order.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product:
            product.stock_quantity += item.quantity

    order.status = OrderStatus.CANCELLED
    order.payment_status = "REFUNDED"
    db.commit()
    db.refresh(order)

    return order

