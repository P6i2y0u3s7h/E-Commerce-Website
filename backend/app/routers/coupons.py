"""
Coupons router: Discount coupon validation and administrative management.
Never trusts frontend calculations.
"""
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_admin
from app.models import Coupon, User
from app.schemas import (
    CouponCreate,
    CouponResponse,
    CouponValidateRequest,
    CouponValidateResponse,
    MessageResponse,
)

router = APIRouter(prefix="/coupons", tags=["Coupons"])


@router.post(
    "/validate",
    response_model=CouponValidateResponse,
    summary="Validate a coupon code and calculate discount",
)
def validate_coupon(
    request: CouponValidateRequest,
    db: Session = Depends(get_db),
):
    """
    Validate coupon against order amount, expiry, and limits.
    Computes exact discount amount on backend.
    """
    code = request.code.strip().upper()
    order_amount = max(0.0, request.order_amount)

    coupon = db.query(Coupon).filter(Coupon.code == code).first()
    if not coupon:
        return CouponValidateResponse(
            valid=False,
            message="Invalid coupon code.",
            final_amount=order_amount,
        )

    if not coupon.is_active:
        return CouponValidateResponse(
            valid=False,
            message="This coupon is no longer active.",
            final_amount=order_amount,
        )

    if coupon.expiration_date:
        now = datetime.now(timezone.utc)
        exp = coupon.expiration_date
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if now > exp:
            return CouponValidateResponse(
                valid=False,
                message="This coupon has expired.",
                final_amount=order_amount,
            )

    if coupon.usage_limit and coupon.used_count >= coupon.usage_limit:
        return CouponValidateResponse(
            valid=False,
            message="This coupon has reached its maximum usage limit.",
            final_amount=order_amount,
        )

    if order_amount < coupon.minimum_order_amount:
        return CouponValidateResponse(
            valid=False,
            message=f"Minimum order amount of ₹{coupon.minimum_order_amount:,.2f} required for this coupon.",
            final_amount=order_amount,
        )

    # Calculate discount
    if coupon.discount_type == "percentage":
        discount = round((coupon.discount_value / 100.0) * order_amount, 2)
    else:  # fixed
        discount = round(min(coupon.discount_value, order_amount), 2)

    final_amount = max(0.0, round(order_amount - discount, 2))

    return CouponValidateResponse(
        valid=True,
        message=f"Coupon applied: ₹{discount:,.2f} discount!",
        code=coupon.code,
        discount_type=coupon.discount_type,
        discount_value=coupon.discount_value,
        discount_amount=discount,
        final_amount=final_amount,
    )


# Admin Endpoints

@router.get("", response_model=List[CouponResponse], summary="List all coupons (admin)")
def list_coupons(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Admin: Retrieve all created discount coupons."""
    return db.query(Coupon).order_by(Coupon.created_at.desc()).all()


@router.post("", response_model=CouponResponse, status_code=status.HTTP_201_CREATED, summary="Create a coupon (admin)")
def create_coupon(
    coupon_data: CouponCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Admin: Create a new coupon code."""
    code = coupon_data.code.strip().upper()
    existing = db.query(Coupon).filter(Coupon.code == code).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Coupon code '{code}' already exists.",
        )

    data = coupon_data.model_dump()
    data["code"] = code
    new_coupon = Coupon(**data)
    db.add(new_coupon)
    db.commit()
    db.refresh(new_coupon)
    return new_coupon


@router.delete("/{coupon_id}", response_model=MessageResponse, summary="Delete a coupon (admin)")
def delete_coupon(
    coupon_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Admin: Delete a coupon."""
    coupon = db.query(Coupon).filter(Coupon.id == coupon_id).first()
    if not coupon:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Coupon not found.")

    db.delete(coupon)
    db.commit()
    return MessageResponse(message="Coupon deleted successfully.")
