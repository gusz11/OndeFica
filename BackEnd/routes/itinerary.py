from typing import Annotated

from fastapi import APIRouter, Depends, Path, Query, Response
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .. import auth, crud_itinerary, database, models, schemas
from ..services import itinerary

router = APIRouter(tags=["Itinerary"])
DB = Annotated[Session, Depends(database.get_db)]
ItemId = Annotated[int, Path(gt=0)]
Skip = Annotated[int, Query(ge=0)]
Limit = Annotated[int, Query(ge=1, le=100)]


@router.get("/itinerary/", response_model=list[schemas.ItineraryItemResponse])
def list_items(
    user: auth.CurrentUser, db: DB, skip: Skip = 0, limit: Limit = 100
) -> list[models.ItineraryItem]:
    return crud_itinerary.get_itinerary_items_by_user(db, user.id, skip, limit)


@router.post("/itinerary/", response_model=schemas.ItineraryItemResponse, status_code=201)
def create_item(data: schemas.ItineraryItemCreate, user: auth.CurrentUser, db: DB) -> models.ItineraryItem:
    return itinerary.create(db, data, user.id)


@router.post("/itinerary/import", response_model=schemas.ItineraryImportResult)
def import_local(
    data: schemas.ItineraryImportRequest, user: auth.CurrentUser, db: DB
) -> schemas.ItineraryImportResult:
    return itinerary.import_local(db, data, user.id)


@router.patch("/itinerary/{item_id}", response_model=schemas.ItineraryItemResponse)
def update_item(
    item_id: ItemId, data: schemas.ItineraryItemUpdate, user: auth.CurrentUser, db: DB
) -> models.ItineraryItem:
    return itinerary.update(db, item_id, data, user.id)


@router.delete("/itinerary/{item_id}", status_code=204)
def delete_item(item_id: ItemId, user: auth.CurrentUser, db: DB) -> Response:
    itinerary.delete(db, item_id, user.id)
    return Response(status_code=204)


@router.get("/favorites/", response_model=list[schemas.FavoritePlaceResponse], tags=["Favorites"])
def list_favorites(
    user: auth.CurrentUser, db: DB, skip: Skip = 0, limit: Limit = 100
) -> list[models.FavoritePlace]:
    return crud_itinerary.get_favorite_places_by_user(db, user.id, skip, limit)


@router.post("/favorites/", response_model=schemas.FavoritePlaceResponse, tags=["Favorites"])
def add_favorite(data: schemas.FavoritePlaceCreate, user: auth.CurrentUser, db: DB) -> models.FavoritePlace:
    existing = crud_itinerary.get_favorite(db, data.place_id_google, user.id)
    if existing:
        return existing
    favorite = models.FavoritePlace(**data.model_dump(), user_id=user.id)
    db.add(favorite)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        existing = crud_itinerary.get_favorite(db, data.place_id_google, user.id)
        if existing:
            return existing
        raise
    db.refresh(favorite)
    return favorite


@router.delete("/favorites/{place_id}", status_code=204, tags=["Favorites"])
def remove_favorite(place_id: schemas.PlaceId, user: auth.CurrentUser, db: DB) -> Response:
    favorite = crud_itinerary.get_favorite(db, place_id, user.id)
    if favorite:
        db.delete(favorite)
        db.commit()
    return Response(status_code=204)
