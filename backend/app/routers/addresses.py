"""
Addresses router: Customer shipping address management.
"""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Address, User
from app.schemas import AddressCreate, AddressUpdate, AddressResponse, MessageResponse

router = APIRouter(prefix="/addresses", tags=["Addresses"])


@router.get("", response_model=List[AddressResponse], summary="List user's saved addresses")
def get_addresses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve saved shipping addresses for the logged-in customer."""
    return (
        db.query(Address)
        .filter(Address.user_id == current_user.id)
        .order_by(Address.is_default.desc(), Address.created_at.desc())
        .all()
    )


@router.post("", response_model=AddressResponse, status_code=status.HTTP_201_CREATED, summary="Add a shipping address")
def create_address(
    address_data: AddressCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Save a new shipping address."""
    # Check if this is user's first address
    count = db.query(Address).filter(Address.user_id == current_user.id).count()
    is_default = address_data.is_default or count == 0

    if is_default:
        # Clear existing default
        db.query(Address).filter(Address.user_id == current_user.id).update({"is_default": False})

    new_address = Address(
        user_id=current_user.id,
        full_name=address_data.full_name,
        phone=address_data.phone,
        street_address=address_data.street_address,
        city=address_data.city,
        state=address_data.state,
        postal_code=address_data.postal_code,
        country=address_data.country,
        is_default=is_default,
    )
    db.add(new_address)
    db.commit()
    db.refresh(new_address)
    return new_address


@router.put("/{address_id}", response_model=AddressResponse, summary="Update an address")
def update_address(
    address_id: int,
    address_data: AddressUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an existing address."""
    address = (
        db.query(Address)
        .filter(Address.id == address_id, Address.user_id == current_user.id)
        .first()
    )
    if not address:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found.")

    data = address_data.model_dump(exclude_unset=True)
    if data.get("is_default"):
        db.query(Address).filter(Address.user_id == current_user.id).update({"is_default": False})

    for field, val in data.items():
        setattr(address, field, val)

    db.commit()
    db.refresh(address)
    return address


@router.delete("/{address_id}", response_model=MessageResponse, summary="Delete an address")
def delete_address(
    address_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete an address."""
    address = (
        db.query(Address)
        .filter(Address.id == address_id, Address.user_id == current_user.id)
        .first()
    )
    if not address:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found.")

    db.delete(address)
    db.commit()
    return MessageResponse(message="Address deleted successfully.")


@router.patch("/{address_id}/default", response_model=AddressResponse, summary="Set as default address")
def set_default_address(
    address_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Set the specified address as default."""
    address = (
        db.query(Address)
        .filter(Address.id == address_id, Address.user_id == current_user.id)
        .first()
    )
    if not address:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found.")

    db.query(Address).filter(Address.user_id == current_user.id).update({"is_default": False})
    address.is_default = True
    db.commit()
    db.refresh(address)
    return address
