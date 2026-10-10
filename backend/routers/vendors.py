import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from auth import get_current_user, require_admin
from database import get_db
from models import NewListing, Product, User, Vendor
from schemas import (
    PaginatedVendors,
    VendorDetail,
    VendorOut,
    ProductOut,
)

router = APIRouter()


def _vendor_to_out(vendor: Vendor, db: Session) -> VendorOut:
    product_count = db.query(func.count(Product.id)).filter(Product.vendor_id == vendor.id).scalar() or 0
    return VendorOut(
        id=vendor.id,
        name=vendor.name,
        email=vendor.email,
        created_at=vendor.created_at,
        product_count=product_count,
    )


def _product_to_out(product: Product) -> ProductOut:
    return ProductOut(
        id=product.id,
        name=product.name,
        url=product.url,
        logo_url=product.logo_url,
        description=product.description,
        category=product.category,
        status=product.status,
        submitted_at=product.submitted_at,
        reviewed_at=product.reviewed_at,
        vendor_id=product.vendor_id,
        vendor_name=product.vendor.name if product.vendor else "",
    )


@router.get("/vendors", response_model=PaginatedVendors)
def list_vendors(
    search: str = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List vendors with optional search, pagination, and product count."""
    query = db.query(Vendor)

    if search:
        query = query.filter(
            Vendor.name.ilike(f"%{search}%") | Vendor.email.ilike(f"%{search}%")
        )

    total = query.count()
    vendors = query.order_by(Vendor.name.asc()).offset((page - 1) * per_page).limit(per_page).all()

    items = [_vendor_to_out(v, db) for v in vendors]
    return PaginatedVendors(items=items, total=total, page=page, per_page=per_page)


@router.get("/vendors/{vendor_id}", response_model=VendorDetail)
def get_vendor(
    vendor_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single vendor with their full product list."""
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vendor not found")

    return VendorDetail(
        id=vendor.id,
        name=vendor.name,
        email=vendor.email,
        created_at=vendor.created_at,
        products=[_product_to_out(p) for p in vendor.products],
    )


@router.delete("/vendors/{vendor_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vendor(
    vendor_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Delete a vendor along with all their products and new_listing records (admin only)."""
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vendor not found")

    # Collect product IDs for this vendor
    product_ids = [p.id for p in db.query(Product.id).filter(Product.vendor_id == vendor_id).all()]

    # Delete new_listings referencing those products or the vendor directly
    if product_ids:
        db.query(NewListing).filter(NewListing.product_id.in_(product_ids)).delete(synchronize_session=False)
    db.query(NewListing).filter(NewListing.vendor_id == vendor_id).delete(synchronize_session=False)

    # Delete products
    db.query(Product).filter(Product.vendor_id == vendor_id).delete(synchronize_session=False)

    db.delete(vendor)
    db.commit()
