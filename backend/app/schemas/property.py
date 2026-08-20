"""Property schemas for validation."""
from typing import Optional, List
from pydantic import BaseModel
from app.models.property import PropertyPurpose, PropertyCategory, FurnishedStatus


class PropertyCreate(BaseModel):
    title: str
    purpose: PropertyPurpose
    category: Optional[PropertyCategory] = PropertyCategory.RESIDENTIAL
    property_type: str
    price: float
    bhk: Optional[int] = None
    area_sqft: Optional[float] = None
    bathrooms: Optional[int] = None
    floor: Optional[int] = None
    total_floors: Optional[int] = None
    furnished_status: Optional[FurnishedStatus] = None
    parking: Optional[int] = None
    description: Optional[str] = None
    images: Optional[List[str]] = None
    image: Optional[str] = None
    city: Optional[str] = "Bhopal"
    locality: Optional[str] = None
    area: Optional[str] = None
    address: Optional[str] = None
    security_deposit: Optional[float] = None
    is_negotiable: Optional[bool] = False
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_whatsapp: Optional[str] = None
