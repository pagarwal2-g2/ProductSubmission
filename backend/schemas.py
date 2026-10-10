from __future__ import annotations
from datetime import datetime
from typing import Optional, List, Literal
from pydantic import BaseModel, EmailStr, ConfigDict, field_validator
import uuid


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    name: Optional[str] = None
    picture: Optional[str] = None
    role: str
    created_at: datetime


class VendorOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    email: str
    created_at: datetime
    product_count: int = 0


class ProductOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    url: str
    logo_url: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    status: str
    submitted_at: datetime
    reviewed_at: Optional[datetime] = None
    vendor_id: uuid.UUID
    vendor_name: str = ""

    @field_validator("vendor_name", mode="before")
    @classmethod
    def extract_vendor_name(cls, v, info):
        # When building from ORM object the raw value passed is "" but we
        # can pull it from the model's vendor relationship via the data dict.
        # Pydantic v2 field_validator with mode="before" receives the field
        # value; vendor relationship is handled in ProductDetail.
        return v


class ProductDetail(ProductOut):
    vendor: Optional[VendorOut] = None
    reviewer: Optional[UserOut] = None


class VendorDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    email: str
    created_at: datetime
    products: List[ProductOut] = []


class ProductCreate(BaseModel):
    name: str
    url: str
    logo_url: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    vendor_name: str
    vendor_email: EmailStr


class StatusUpdate(BaseModel):
    status: Literal["approved", "rejected"]


class PaginatedProducts(BaseModel):
    items: List[ProductOut]
    total: int
    page: int
    per_page: int


class PaginatedVendors(BaseModel):
    items: List[VendorOut]
    total: int
    page: int
    per_page: int
