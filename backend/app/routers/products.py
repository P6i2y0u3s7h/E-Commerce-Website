"""
Products router: public product listing, search, filtering, recommendations,
autocomplete suggestions, and admin CRUD endpoints.
"""
from typing import List, Optional
import json

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, desc, asc, func
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_admin
from app.models import Product, ProductImage, ProductVariant, User, Review
from app.schemas import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    SearchSuggestion,
    FilterMetaResponse,
    ProductRecommendationsResponse,
)

router = APIRouter(prefix="/products", tags=["Products"])


@router.get(
    "/search/suggestions",
    response_model=List[SearchSuggestion],
    summary="Get search suggestions / autocomplete",
)
def get_search_suggestions(
    q: str = Query(..., min_length=1, description="Search query string"),
    limit: int = Query(6, ge=1, le=20),
    db: Session = Depends(get_db),
):
    """Returns top matching products for header search autocomplete."""
    term = f"%{q.strip()}%"
    matches = (
        db.query(Product)
        .filter(
            or_(
                Product.name.ilike(term),
                Product.category.ilike(term),
                Product.brand.ilike(term),
            )
        )
        .limit(limit)
        .all()
    )
    return [
        SearchSuggestion(
            id=p.id,
            name=p.name,
            category=p.category or "General",
            price=p.price,
            image_url=p.image_url,
        )
        for p in matches
    ]


@router.get(
    "/meta/filters",
    response_model=FilterMetaResponse,
    summary="Get available categories, brands, and price boundaries",
)
def get_filter_meta(db: Session = Depends(get_db)):
    """Provides dynamic categories, brands, and price ranges for filter UI."""
    categories = [
        c[0]
        for c in db.query(Product.category).distinct().filter(Product.category.isnot(None)).all()
        if c[0]
    ]
    brands = [
        b[0]
        for b in db.query(Product.brand).distinct().filter(Product.brand.isnot(None)).all()
        if b[0]
    ]

    min_price_row = db.query(func.min(Product.price)).scalar() or 0.0
    max_price_row = db.query(func.max(Product.price)).scalar() or 1000.0

    return FilterMetaResponse(
        categories=sorted(categories),
        brands=sorted(brands),
        min_price=float(min_price_row),
        max_price=float(max_price_row),
    )


@router.get(
    "",
    response_model=List[ProductResponse],
    summary="List all products with search, filtering, and sorting",
)
def get_products(
    search: Optional[str] = Query(None, description="Search term for name, description, category, brand"),
    category: Optional[str] = Query(None, description="Filter by category"),
    brand: Optional[str] = Query(None, description="Filter by brand"),
    min_price: Optional[float] = Query(None, ge=0, description="Minimum price filter"),
    max_price: Optional[float] = Query(None, ge=0, description="Maximum price filter"),
    in_stock: Optional[bool] = Query(None, description="Filter in-stock products"),
    min_rating: Optional[float] = Query(None, ge=0, le=5, description="Filter by minimum rating"),
    sort: Optional[str] = Query(
        "newest",
        description="Sort by: newest, price_asc, price_desc, name_asc, name_desc, popular, rating",
    ),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """
    Returns filtered, searched, and sorted list of products.
    Public endpoint — no authentication required.
    """
    query = db.query(Product)

    # 1. Search filter across name, description, category, and brand
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Product.name.ilike(term),
                Product.description.ilike(term),
                Product.category.ilike(term),
                Product.brand.ilike(term),
            )
        )

    # 2. Category filter
    if category and category.strip() and category.lower() != "all":
        query = query.filter(Product.category == category.strip())

    # 3. Brand filter
    if brand and brand.strip() and brand.lower() != "all":
        query = query.filter(Product.brand == brand.strip())

    # 4. Price range filter
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)

    # 5. Availability filter
    if in_stock is True:
        query = query.filter(Product.stock_quantity > 0)
    elif in_stock is False:
        query = query.filter(Product.stock_quantity == 0)

    # 6. Rating filter
    if min_rating is not None:
        query = query.filter(Product.rating >= min_rating)

    # 7. Sorting
    if sort == "price_asc":
        query = query.order_by(asc(Product.price))
    elif sort == "price_desc":
        query = query.order_by(desc(Product.price))
    elif sort == "name_asc":
        query = query.order_by(asc(Product.name))
    elif sort == "name_desc":
        query = query.order_by(desc(Product.name))
    elif sort == "popular":
        query = query.order_by(desc(Product.review_count), desc(Product.rating))
    elif sort == "rating":
        query = query.order_by(desc(Product.rating), desc(Product.review_count))
    else:  # default: newest
        query = query.order_by(desc(Product.created_at))

    products = query.offset(skip).limit(limit).all()
    return products


@router.get(
    "/{product_id}/recommendations",
    response_model=ProductRecommendationsResponse,
    summary="Get similar and recommended products",
)
def get_recommendations(product_id: int, db: Session = Depends(get_db)):
    """Returns similar products in same category, popular recommendations, and customers also viewed."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id={product_id} not found.",
        )

    # Similar: Same category, excluding current product
    similar = (
        db.query(Product)
        .filter(Product.category == product.category, Product.id != product.id)
        .limit(4)
        .all()
    )

    # Recommended: High rating or similar price bracket
    recommended = (
        db.query(Product)
        .filter(Product.id != product.id)
        .order_by(desc(Product.rating), desc(Product.stock_quantity))
        .limit(4)
        .all()
    )

    # Also viewed: High review count or other top items
    also_viewed = (
        db.query(Product)
        .filter(Product.id != product.id, Product.id.notin_([p.id for p in similar]))
        .order_by(desc(Product.review_count))
        .limit(4)
        .all()
    )

    return ProductRecommendationsResponse(
        similar=similar,
        recommended=recommended,
        also_viewed=also_viewed,
    )


@router.get(
    "/{product_id}",
    response_model=ProductResponse,
    summary="Get a single product by ID (public)",
)
def get_product(product_id: int, db: Session = Depends(get_db)):
    """Returns a single product by its ID."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id={product_id} not found.",
        )
    return product


@router.post(
    "",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new product (admin only)",
)
def create_product(
    product_data: ProductCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Create a new product with optional additional images and variants."""
    data = product_data.model_dump()
    additional_images = data.pop("additional_images", None) or []

    new_product = Product(**data)
    db.add(new_product)
    db.flush()

    # Add primary image as first gallery image if present
    if new_product.image_url:
        db.add(ProductImage(product_id=new_product.id, image_url=new_product.image_url, display_order=0))

    # Add additional gallery images
    for idx, img_url in enumerate(additional_images, start=1):
        if img_url and img_url.strip():
            db.add(ProductImage(product_id=new_product.id, image_url=img_url.strip(), display_order=idx))

    db.commit()
    db.refresh(new_product)
    return new_product


@router.put(
    "/{product_id}",
    response_model=ProductResponse,
    summary="Update a product (admin only)",
)
def update_product(
    product_id: int,
    product_data: ProductUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Update an existing product by ID."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id={product_id} not found.",
        )

    update_data = product_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)
    return product


@router.delete(
    "/{product_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a product (admin only)",
)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Delete a product by ID."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id={product_id} not found.",
        )
    db.delete(product)
    db.commit()
