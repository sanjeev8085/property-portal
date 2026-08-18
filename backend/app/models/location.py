"""
Location ORM Model
"""
import uuid
from sqlalchemy import Column, Float, Index, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class Location(Base):
    __tablename__ = "locations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    city = Column(String(100), nullable=False, index=True)
    area = Column(String(200), nullable=True)
    locality = Column(String(200), nullable=True)
    landmark = Column(String(300), nullable=True)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    full_address = Column(String(500), nullable=True)

    properties = relationship("Property", back_populates="location")

    __table_args__ = (
        Index("ix_location_city_area", "city", "area"),
    )

    def __repr__(self):
        return f"<Location {self.city}, {self.area}>"
