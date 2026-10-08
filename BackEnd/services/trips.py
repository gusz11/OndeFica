from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models, schemas


def require(db: Session, trip_id: int, user_id: int) -> models.Trip:
    trip = db.scalar(select(models.Trip).where(models.Trip.id == trip_id, models.Trip.user_id == user_id))
    if trip is None:
        raise HTTPException(404, "Viagem não encontrada")
    return trip


def for_booking(db: Session, trip_id: int | None, user_id: int) -> models.Trip:
    # Old clients and local imports without a trip remain compatible.
    db.scalar(select(models.User).where(models.User.id == user_id).with_for_update())
    if trip_id is not None:
        return require(db, trip_id, user_id)
    trip = db.scalar(select(models.Trip).where(models.Trip.user_id == user_id).order_by(models.Trip.id))
    if trip is None:
        trip = models.Trip(user_id=user_id, name="Minha viagem")
        db.add(trip)
        db.flush()
    return trip


def check_dates(trip: models.Trip | schemas.TripBase, item: schemas.ItineraryItemBase) -> None:
    dates = [value for value in (item.visit_date, item.check_in_date, item.check_out_date) if value]
    if (
        trip.start_date
        and trip.end_date
        and any(value < trip.start_date or value > trip.end_date for value in dates)
    ):
        raise HTTPException(409, "As datas do item devem estar dentro do período da viagem")


def update(db: Session, trip_id: int, user_id: int, data: schemas.TripUpdate) -> models.Trip:
    db.scalar(select(models.User).where(models.User.id == user_id).with_for_update())
    trip = require(db, trip_id, user_id)
    fields = data.model_dump(exclude_unset=True)
    merged = schemas.TripBase.model_validate(trip).model_dump() | fields
    try:
        valid = schemas.TripBase.model_validate(merged)
    except ValidationError:
        raise HTTPException(422, "Confira o nome e o período da viagem") from None
    for item in trip.items:
        check_dates(valid, schemas.ItineraryItemBase.model_validate(item))
    for field, value in fields.items():
        setattr(trip, field, value)
    db.commit()
    db.refresh(trip)
    return trip
