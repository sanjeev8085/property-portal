from typing import Optional, List, Any
from pydantic import BaseModel, model_validator
from app.models.property import PropertyPurpose, PropertyCategory, FurnishedStatus


class PropertyCreate(BaseModel):
    title: str
    purpose: str
    category: Optional[Any] = PropertyCategory.RESIDENTIAL
    property_type: str
    price: float
    bhk: Optional[int] = None
    area_sqft: Optional[float] = None
    bathrooms: Optional[int] = None
    floor: Optional[int] = None
    total_floors: Optional[int] = None
    furnished_status: Optional[Any] = None
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
    idempotency_key: Optional[str] = None
    amenities: Optional[List[str]] = None

    @model_validator(mode="before")
    @classmethod
    def sanitize_fields(cls, data: Any) -> Any:
        if not isinstance(data, dict):
            return data
        
        cleaned = dict(data)
        for k, v in cleaned.items():
            if v == "" or v == "null" or v == "undefined":
                cleaned[k] = None
        
        # Clean price string
        if isinstance(cleaned.get("price"), str):
            try:
                cleaned["price"] = float(cleaned["price"].replace(",", "").replace("₹", "").strip())
            except Exception:
                pass
                
        # Clean bhk
        if isinstance(cleaned.get("bhk"), str):
            try:
                cleaned["bhk"] = int(cleaned["bhk"])
            except Exception:
                cleaned["bhk"] = None
                
        # Clean area_sqft
        if isinstance(cleaned.get("area_sqft"), str):
            try:
                cleaned["area_sqft"] = float(cleaned["area_sqft"])
            except Exception:
                cleaned["area_sqft"] = None

        return cleaned
