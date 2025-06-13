from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum as SQLAlchemyEnum, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from database import Base 

class ItineraryItemType(enum.Enum):
    place = "place"
    hotel = "hotel"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, index=True, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    itinerary_items = relationship("ItineraryItem", back_populates="owner")
    favorite_places = relationship("FavoritePlace", back_populates="owner")

class ItineraryItem(Base):
    __tablename__ = "itinerary_items"
    # ... (resto do seu modelo ItineraryItem como antes) ...
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    place_id_google = Column(String, index=True, nullable=True)
    place_title = Column(String, nullable=False)
    item_type = Column(SQLAlchemyEnum(ItineraryItemType), nullable=False)
    visit_date = Column(String, nullable=True)
    number_of_people = Column(Integer, nullable=True)
    check_in_date = Column(String, nullable=True)
    check_out_date = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
    formatted_address = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    custom_notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    owner = relationship("User", back_populates="itinerary_items")

class FavoritePlace(Base):
    __tablename__ = "favorite_places"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    place_id_google = Column(String, index=True, nullable=False)
    place_title = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    owner = relationship("User", back_populates="favorite_places")

class PlaceCache(Base):
    __tablename__ = "place_cache"
    place_id_google = Column(String, primary_key=True, index=True)
    data = Column(String) 
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())