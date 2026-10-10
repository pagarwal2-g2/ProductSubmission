import csv
import io
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from auth import get_current_user, require_admin
from database import get_db
from models import NewListing, Product, User, Vendor
from schemas import (
    PaginatedProducts,
    ProductCreate,
    ProductDetail,
    ProductOut,
    StatusUpdate,
    VendorOut,
    UserOut,
)

router = APIRouter()


def _product_to_detail(product: Product) -> ProductDetail:
    """Convert a Product ORM object to a ProductDetail schema."""
    vendor_out = None
    if product.vendor:
        vendor_out = VendorOut(
            id=product.vendor.id,
            name=product.vendor.name,
            email=product.vendor.email,
            created_at=product.vendor.created_at,
            product_count=len(product.vendor.products),
        )

    reviewer_out = None
    if product.reviewer:
        reviewer_out = UserOut.model_validate(product.reviewer)

    return ProductDetail(
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
        vendor=vendor_out,
        reviewer=reviewer_out,
    )


def _product_to_out(product: Product) -> ProductOut:
    """Convert a Product ORM object to a ProductOut schema."""
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


@router.post("/products", response_model=ProductDetail, status_code=status.HTTP_201_CREATED)
def create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit a new product for review. Upserts the vendor by email."""
    # Upsert vendor
    vendor = db.query(Vendor).filter(Vendor.email == payload.vendor_email).first()
    if not vendor:
        vendor = Vendor(
            id=uuid.uuid4(),
            name=payload.vendor_name,
            email=str(payload.vendor_email),
        )
        db.add(vendor)
        db.flush()
    else:
        # Update name if it changed
        if vendor.name != payload.vendor_name:
            vendor.name = payload.vendor_name

    # Create product
    product = Product(
        id=uuid.uuid4(),
        vendor_id=vendor.id,
        name=payload.name,
        url=payload.url,
        logo_url=payload.logo_url,
        description=payload.description,
        category=payload.category,
        status="pending",
    )
    db.add(product)
    db.flush()

    # Create new listing entry
    listing = NewListing(
        id=uuid.uuid4(),
        product_id=product.id,
        vendor_id=vendor.id,
        request_type="new_product",
        status="pending",
    )
    db.add(listing)
    db.commit()
    db.refresh(product)

    return _product_to_detail(product)


@router.get("/products", response_model=PaginatedProducts)
def list_products(
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    sort_by: str = Query("submitted_at"),
    sort_dir: str = Query("desc"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List products with optional filtering, searching, sorting, and pagination."""
    query = db.query(Product)

    if status_filter:
        query = query.filter(Product.status == status_filter)

    if search:
        query = query.filter(Product.name.ilike(f"%{search}%"))

    # Validate sort_by to prevent SQL injection
    allowed_sort_fields = {"submitted_at", "name", "status", "reviewed_at"}
    if sort_by not in allowed_sort_fields:
        sort_by = "submitted_at"

    sort_column = getattr(Product, sort_by, Product.submitted_at)
    if sort_dir.lower() == "asc":
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())

    total = query.count()
    products = query.offset((page - 1) * per_page).limit(per_page).all()

    return PaginatedProducts(
        items=[_product_to_out(p) for p in products],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get("/products/export/csv")
def export_products_csv(
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Export all products as a CSV file (admin only)."""
    query = db.query(Product)

    if status_filter:
        query = query.filter(Product.status == status_filter)

    if search:
        query = query.filter(Product.name.ilike(f"%{search}%"))

    products = query.order_by(Product.submitted_at.desc()).all()

    output = io.StringIO()
    writer = csv.DictWriter(
        output,
        fieldnames=[
            "id",
            "name",
            "url",
            "logo_url",
            "description",
            "category",
            "status",
            "vendor_name",
            "vendor_email",
            "submitted_at",
            "reviewed_at",
        ],
    )
    writer.writeheader()
    for p in products:
        writer.writerow(
            {
                "id": str(p.id),
                "name": p.name,
                "url": p.url,
                "logo_url": p.logo_url or "",
                "description": p.description or "",
                "category": p.category or "",
                "status": p.status,
                "vendor_name": p.vendor.name if p.vendor else "",
                "vendor_email": p.vendor.email if p.vendor else "",
                "submitted_at": p.submitted_at.isoformat() if p.submitted_at else "",
                "reviewed_at": p.reviewed_at.isoformat() if p.reviewed_at else "",
            }
        )

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=products.csv"},
    )


@router.get("/products/{product_id}", response_model=ProductDetail)
def get_product(
    product_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single product by ID."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return _product_to_detail(product)


@router.patch("/products/{product_id}/status", response_model=ProductDetail)
def update_product_status(
    product_id: uuid.UUID,
    payload: StatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Approve or reject a product (admin only)."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    product.status = payload.status
    product.reviewed_at = datetime.now(timezone.utc)
    product.reviewer_id = current_user.id

    # Sync the corresponding NewListing status
    listing = (
        db.query(NewListing)
        .filter(NewListing.product_id == product_id)
        .order_by(NewListing.created_at.desc())
        .first()
    )
    if listing:
        listing.status = payload.status

    db.commit()
    db.refresh(product)
    return _product_to_detail(product)


@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Delete a product and its associated new_listing records (admin only)."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    # Delete new listings first to respect FK constraint
    db.query(NewListing).filter(NewListing.product_id == product_id).delete()
    db.delete(product)
    db.commit()
