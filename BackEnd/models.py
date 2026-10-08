from datetime import datetime
from enum import StrEnum

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, String, UniqueConstraint, func
from sqlalchemy import Enum as SQLAlchemyEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class ItineraryItemType(StrEnum):
    place = "place"
    hotel = "hotel"


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(254), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String)
    full_name: Mapped[str | None] = mapped_column(String(120))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), onupdate=func.now())
    itinerary_items: Mapped[list["ItineraryItem"]] = relationship(
        back_populates="owner", cascade="all, delete-orphan"
    )
    favorite_places: Mapped[list["FavoritePlace"]] = relationship(
        back_populates="owner", cascade="all, delete-orphan"
    )


class Trip(Base):
    __tablename__ = "trips"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    name: Mapped[str] = mapped_column(String(200))
    start_date: Mapped[str | None] = mapped_column(String(10))
    end_date: Mapped[str | None] = mapped_column(String(10))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    items: Mapped[list["ItineraryItem"]] = relationship(back_populates="trip", cascade="all, delete-orphan")


class ItineraryItem(Base):
    __tablename__ = "itinerary_items"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    trip_id: Mapped[int | None] = mapped_column(ForeignKey("trips.id"), index=True)
    place_id_google: Mapped[str | None] = mapped_column(String(255), index=True)
    place_title: Mapped[str] = mapped_column(String(200))
    item_type: Mapped[ItineraryItemType] = mapped_column(SQLAlchemyEnum(ItineraryItemType))
    # Keep existing ISO-string columns; Pydantic validates actual calendar dates.
    visit_date: Mapped[str | None] = mapped_column(String(10))
    number_of_people: Mapped[int | None]
    start_time: Mapped[str | None] = mapped_column(String(5))
    duration_minutes: Mapped[int | None]
    sort_order: Mapped[int] = mapped_column(default=0, server_default="0")
    check_in_date: Mapped[str | None] = mapped_column(String(10))
    check_out_date: Mapped[str | None] = mapped_column(String(10))
    image_url: Mapped[str | None] = mapped_column(String(4096))
    formatted_address: Mapped[str | None] = mapped_column(String(500))
    latitude: Mapped[float | None] = mapped_column(Float)
    longitude: Mapped[float | None] = mapped_column(Float)
    custom_notes: Mapped[str | None] = mapped_column(String(2000))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    owner: Mapped[User] = relationship(back_populates="itinerary_items")
    trip: Mapped[Trip | None] = relationship(back_populates="items")


class FavoritePlace(Base):
    __tablename__ = "favorite_places"
    __table_args__ = (UniqueConstraint("user_id", "place_id_google", name="uq_favorite_owner_place"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    place_id_google: Mapped[str] = mapped_column(String(255), index=True)
    place_title: Mapped[str | None] = mapped_column(String(200))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    owner: Mapped[User] = relationship(back_populates="favorite_places")


class PlaceCache(Base):
    __tablename__ = "place_cache"
    place_id_google: Mapped[str] = mapped_column(String, primary_key=True)
    data: Mapped[str | None] = mapped_column(String)
    last_updated: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class ItineraryImport(Base):
    __tablename__ = "itinerary_imports"
    __table_args__ = (UniqueConstraint("user_id", "local_id", name="uq_import_owner_local"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    local_id: Mapped[str] = mapped_column(String(255))
    item_id: Mapped[int | None] = mapped_column(ForeignKey("itinerary_items.id", ondelete="SET NULL"))
