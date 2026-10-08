from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, Query, Response
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from .. import auth, database, models, schemas
from ..services import trips

router = APIRouter(prefix="/trips", tags=["Trips"])
DB = Annotated[Session, Depends(database.get_db)]
TripId = Annotated[int, Path(gt=0)]


@router.get("/", response_model=list[schemas.TripResponse])
def list_trips(
    user: auth.CurrentUser,
    db: DB,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 100,
) -> list[models.Trip]:
    return list(
        db.scalars(
            select(models.Trip)
            .where(models.Trip.user_id == user.id)
            .order_by(models.Trip.id.desc())
            .offset(skip)
            .limit(limit)
        )
    )


@router.post("/", response_model=schemas.TripResponse, status_code=201)
def create_trip(data: schemas.TripCreate, user: auth.CurrentUser, db: DB) -> models.Trip:
    trip = models.Trip(**data.model_dump(), user_id=user.id)
    db.add(trip)
    db.commit()
    db.refresh(trip)
    return trip


@router.patch("/{trip_id}", response_model=schemas.TripResponse)
def update_trip(trip_id: TripId, data: schemas.TripUpdate, user: auth.CurrentUser, db: DB) -> models.Trip:
    return trips.update(db, trip_id, user.id, data)


@router.delete("/{trip_id}", status_code=204)
def delete_trip(trip_id: TripId, user: auth.CurrentUser, db: DB) -> Response:
    db.scalar(select(models.User).where(models.User.id == user.id).with_for_update())
    trip = trips.require(db, trip_id, user.id)
    db.delete(trip)
    db.commit()
    return Response(status_code=204)


@router.post("/{trip_id}/days/{day}/order", response_model=list[schemas.ItineraryItemResponse])
def order_day(
    trip_id: TripId, day: date, data: schemas.DayOrder, user: auth.CurrentUser, db: DB
) -> list[models.ItineraryItem]:
    db.scalar(select(models.User).where(models.User.id == user.id).with_for_update())
    trips.require(db, trip_id, user.id)
    items = list(
        db.scalars(
            select(models.ItineraryItem).where(
                models.ItineraryItem.user_id == user.id,
                models.ItineraryItem.trip_id == trip_id,
                or_(
                    models.ItineraryItem.visit_date == day.isoformat(),
                    models.ItineraryItem.check_in_date == day.isoformat(),
                ),
            )
        )
    )
    if set(data.item_ids) != {item.id for item in items}:
        raise HTTPException(409, "A programação mudou. Atualize e ordene novamente todos os itens deste dia")
    by_id = {item.id: item for item in items}
    for position, item_id in enumerate(data.item_ids):
        by_id[item_id].sort_order = position
    db.commit()
    return [by_id[item_id] for item_id in data.item_ids]
