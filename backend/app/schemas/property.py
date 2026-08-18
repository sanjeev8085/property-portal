"""Property schemas for validation."""
from typing import Optional
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
