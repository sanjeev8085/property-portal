import re
from typing import Optional, List, Any
from pydantic import BaseModel, model_validator, field_validator
from app.models.property import PropertyPurpose, PropertyCategory, FurnishedStatus

ALLOWED_PROPERTY_TYPES = {
    "Apartment",
    "Villa / House",
    "Independent Floor",
    "Shop",
    "Office Space",
    "Plot / Land",
    "Warehouse",
    "PG / Hostel",
}

PHONE_REGEX = re.compile(r"^(\+91[\-\s]?)?[6-9]\d{9}$")
EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
CLEAN_NUMERIC_REGEX = re.compile(r"^\d+(\.\d+)?$")


class ImageMetaInput(BaseModel):
    url: str
    thumbnail_url: Optional[str] = None
    card_url: Optional[str] = None
    detail_url: Optional[str] = None
    public_id: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    file_size: Optional[int] = None


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
    furnished: Optional[str] = None
    pg_for: Optional[str] = None
    room_type: Optional[str] = None
    food_status: Optional[str] = None
    parking: Optional[int] = None
    description: Optional[str] = None
    images: Optional[List[Any]] = None
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
    contact_email: Optional[str] = None
    idempotency_key: Optional[str] = None
    amenities: Optional[List[str]] = None

    @field_validator("property_type")
    @classmethod
    def validate_property_type(cls, v: str) -> str:
        if v not in ALLOWED_PROPERTY_TYPES:
            raise ValueError(f"Invalid property_type '{v}'. Allowed types: {', '.join(sorted(ALLOWED_PROPERTY_TYPES))}")
        return v

    @model_validator(mode="before")
    @classmethod
    def sanitize_fields(cls, data: Any) -> Any:
        if not isinstance(data, dict):
            return data
        
        cleaned = dict(data)
        for k, v in cleaned.items():
            if v == "" or v == "null" or v == "undefined":
                cleaned[k] = None

        # Clean & validate price
        raw_price = cleaned.get("price")
        if raw_price is not None:
            if isinstance(raw_price, (int, float)):
                if raw_price <= 0:
                    raise ValueError("Price must be a positive number greater than 0.")
            elif isinstance(raw_price, str):
                s = raw_price.replace(",", "").replace("₹", "").strip()
                if not CLEAN_NUMERIC_REGEX.match(s):
                    raise ValueError(f"Invalid numeric price format: '{raw_price}'. Price cannot contain letters or invalid characters.")
                val = float(s)
                if val <= 0:
                    raise ValueError("Price must be a positive number greater than 0.")
                cleaned["price"] = val

        # Clean & validate bhk
        raw_bhk = cleaned.get("bhk")
        if raw_bhk is not None:
            if isinstance(raw_bhk, str):
                try:
                    cleaned["bhk"] = int(raw_bhk.strip())
                except ValueError:
                    raise ValueError(f"Invalid BHK integer format: '{raw_bhk}'")
            if isinstance(cleaned.get("bhk"), int) and cleaned["bhk"] < 0:
                raise ValueError("BHK cannot be negative.")

        # Clean & validate area_sqft
        raw_area = cleaned.get("area_sqft")
        if raw_area is not None:
            if isinstance(raw_area, str):
                s = raw_area.replace(",", "").strip()
                if not CLEAN_NUMERIC_REGEX.match(s):
                    raise ValueError(f"Invalid area_sqft format: '{raw_area}'. Area must be a positive number.")
                cleaned["area_sqft"] = float(s)
            if isinstance(cleaned.get("area_sqft"), (int, float)) and cleaned["area_sqft"] <= 0:
                raise ValueError("Area (sqft) must be greater than 0.")

        # Clean & validate bathrooms
        raw_bath = cleaned.get("bathrooms")
        if raw_bath is not None:
            if isinstance(raw_bath, str):
                try:
                    cleaned["bathrooms"] = int(raw_bath.strip())
                except ValueError:
                    raise ValueError(f"Invalid bathrooms format: '{raw_bath}'")
            if isinstance(cleaned.get("bathrooms"), int) and cleaned["bathrooms"] < 0:
                raise ValueError("Bathrooms count cannot be negative.")

        # Clean & validate contact_phone
        phone = cleaned.get("contact_phone")
        if phone:
            clean_p = str(phone).strip()
            if not PHONE_REGEX.match(clean_p):
                raise ValueError(f"Invalid contact phone number format: '{phone}'. Expected 10-digit mobile number.")
            cleaned["contact_phone"] = clean_p

        # Clean & validate contact_email
        email = cleaned.get("contact_email")
        if email:
            clean_e = str(email).strip()
            if not EMAIL_REGEX.match(clean_e):
                raise ValueError(f"Invalid contact email format: '{email}'.")
            cleaned["contact_email"] = clean_e

        return cleaned
