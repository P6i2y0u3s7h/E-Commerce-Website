"""
Reviews router: Product reviews and ratings.
Computes average ratings and distributions dynamically.
"""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Review, Product, User, UserRole
from app.schemas import (
    ReviewCreate,
    ReviewUpdate,
    ReviewResponse,
    ReviewStatsResponse,
    MessageResponse,
)

router = APIRouter(tags=["Reviews"])


def _update_product_rating(db: Session, product_id: int):
    """Recalculate average rating and count on Product model."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        return

    reviews = db.query(Review).filter(Review.product_id == product_id).all()
    count = len(reviews)
    if count == 0:
        product.rating = 5.0
        product.review_count = 0
    else:
        avg_rating = sum(r.rating for r in reviews) / count
        product.rating = round(avg_rating, 1)
        product.review_count = count

    db.commit()


@router.get(
    "/products/{product_id}/reviews",
    response_model=ReviewStatsResponse,
    summary="Get product reviews and rating statistics",
)
def get_product_reviews(product_id: int, db: Session = Depends(get_db)):
    """Fetch all reviews for a product with breakdown by star rating."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found.",
        )

    reviews = (
        db.query(Review)
        .filter(Review.product_id == product_id)
        .order_by(Review.created_at.desc())
        .all()
    )

    distribution = {"5": 0, "4": 0, "3": 0, "2": 0, "1": 0}
    for r in reviews:
        star_str = str(r.rating)
        if star_str in distribution:
            distribution[star_str] += 1

    total = len(reviews)
    avg_rating = round(sum(r.rating for r in reviews) / total, 1) if total > 0 else 5.0

    return ReviewStatsResponse(
        average_rating=avg_rating,
        total_reviews=total,
        rating_distribution=distribution,
        reviews=reviews,
    )


@router.post(
    "/products/{product_id}/reviews",
    response_model=ReviewResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a product review",
)
def create_review(
    product_id: int,
    review_data: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a 1-5 star review for a product."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found.",
        )

    # Check if user already reviewed this product
    existing = (
        db.query(Review)
        .filter(Review.product_id == product_id, Review.user_id == current_user.id)
        .first()
    )
    if existing:
        # Update existing review
        existing.rating = review_data.rating
        existing.title = review_data.title
        existing.comment = review_data.comment
        db.commit()
        db.refresh(existing)
        _update_product_rating(db, product_id)
        return existing

    review = Review(
        product_id=product_id,
        user_id=current_user.id,
        rating=review_data.rating,
        title=review_data.title,
        comment=review_data.comment,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    _update_product_rating(db, product_id)
    return review


@router.put(
    "/reviews/{review_id}",
    response_model=ReviewResponse,
    summary="Update user's own review",
)
def update_review(
    review_id: int,
    review_data: ReviewUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Edit review. Only author can edit."""
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found.",
        )

    if review.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to edit this review.",
        )

    data = review_data.model_dump(exclude_unset=True)
    for field, val in data.items():
        setattr(review, field, val)

    db.commit()
    db.refresh(review)
    _update_product_rating(db, review.product_id)
    return review


@router.delete(
    "/reviews/{review_id}",
    response_model=MessageResponse,
    summary="Delete a review",
)
def delete_review(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete review. Author or admin can delete."""
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found.",
        )

    if review.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this review.",
        )

    product_id = review.product_id
    db.delete(review)
    db.commit()
    _update_product_rating(db, product_id)
    return MessageResponse(message="Review deleted successfully.")


@router.get(
    "/reviews/me",
    response_model=List[ReviewResponse],
    summary="Get all reviews written by currently authenticated user",
)
def get_my_reviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all reviews authored by the currently logged-in user with product details."""
    reviews = (
        db.query(Review)
        .options(joinedload(Review.product), joinedload(Review.user))
        .filter(Review.user_id == current_user.id)
        .order_by(Review.created_at.desc())
        .all()
    )
    return reviews

