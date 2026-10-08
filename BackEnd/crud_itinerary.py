"""Repository operations always include the owner."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from . import models, schemas


def get_itinerary_item(db: Session, item_id: int, user_id: int) -> models.ItineraryItem | None:
    return db.scalar(
        select(models.ItineraryItem).where(
            models.ItineraryItem.id == item_id, models.ItineraryItem.user_id == user_id
        )
    )


def get_itinerary_items_by_user(
    db: Session, user_id: int, skip: int = 0, limit: int = 100
) -> list[models.ItineraryItem]:
    return list(
        db.scalars(
            select(models.ItineraryItem)
            .where(models.ItineraryItem.user_id == user_id)
            .order_by(models.ItineraryItem.id)
            .offset(skip)
            .limit(limit)
        )
    )


def create_itinerary_item(
    db: Session, item: schemas.ItineraryItemCreate, user_id: int
) -> models.ItineraryItem:
    from .services.itinerary import create

    return create(db, item, user_id)


def get_favorite_places_by_user(
    db: Session, user_id: int, skip: int = 0, limit: int = 100
) -> list[models.FavoritePlace]:
    return list(
        db.scalars(
            select(models.FavoritePlace)
            .where(models.FavoritePlace.user_id == user_id)
            .order_by(models.FavoritePlace.id)
            .offset(skip)
            .limit(limit)
        )
    )


def get_favorite(db: Session, place_id: str, user_id: int) -> models.FavoritePlace | None:
    return db.scalar(
        select(models.FavoritePlace).where(
            models.FavoritePlace.place_id_google == place_id, models.FavoritePlace.user_id == user_id
        )
    )
