from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from .. import crud_itinerary, models, schemas
from . import trips


def require_item(db: Session, item_id: int, user_id: int) -> models.ItineraryItem:
    item = crud_itinerary.get_itinerary_item(db, item_id, user_id)
    if item is None:
        raise HTTPException(404, "Item não encontrado")
    return item


def check_overlap(
    db: Session, user_id: int, data: schemas.ItineraryItemBase, exclude_id: int | None = None
) -> None:
    # Serialize writes per owner on PostgreSQL; SQLite is intended only for local development.
    db.scalar(select(models.User).where(models.User.id == user_id).with_for_update())
    if data.item_type != models.ItineraryItemType.hotel:
        return
    query = select(models.ItineraryItem.id).where(
        models.ItineraryItem.user_id == user_id,
        models.ItineraryItem.trip_id == data.trip_id,
        models.ItineraryItem.item_type == models.ItineraryItemType.hotel,
        models.ItineraryItem.check_in_date < data.check_out_date,
        models.ItineraryItem.check_out_date > data.check_in_date,
    )
    if exclude_id is not None:
        query = query.where(models.ItineraryItem.id != exclude_id)
    if db.scalar(query) is not None:
        raise HTTPException(409, "Datas de hospedagem se sobrepõem a uma reserva existente")


def create(db: Session, data: schemas.ItineraryItemCreate, user_id: int) -> models.ItineraryItem:
    trip = trips.for_booking(db, data.trip_id, user_id)
    data = data.model_copy(update={"trip_id": trip.id})
    trips.check_dates(trip, data)
    check_overlap(db, user_id, data)
    item = models.ItineraryItem(
        **data.model_dump(), user_id=user_id, sort_order=next_order(db, user_id, data)
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def next_order(db: Session, user_id: int, data: schemas.ItineraryItemBase) -> int:
    day = data.visit_date or data.check_in_date
    maximum = db.scalar(
        select(func.max(models.ItineraryItem.sort_order)).where(
            models.ItineraryItem.user_id == user_id,
            models.ItineraryItem.trip_id == data.trip_id,
            or_(models.ItineraryItem.visit_date == day, models.ItineraryItem.check_in_date == day),
        )
    )
    return 0 if maximum is None else maximum + 1


def update(
    db: Session, item_id: int, data: schemas.ItineraryItemUpdate, user_id: int
) -> models.ItineraryItem:
    db.scalar(select(models.User).where(models.User.id == user_id).with_for_update())
    item = require_item(db, item_id, user_id)
    fields = data.model_dump(exclude_unset=True)
    merged = schemas.ItineraryItemBase.model_validate(item).model_dump()
    merged.update(fields)
    try:
        validated = schemas.ItineraryItemBase.model_validate(merged)
    except ValidationError:
        raise HTTPException(
            422, "Dados da programação inválidos; confira datas e quantidade de pessoas"
        ) from None
    check_overlap(db, user_id, validated, item_id)
    trip = trips.for_booking(db, validated.trip_id, user_id)
    trips.check_dates(trip, validated)
    if (item.visit_date or item.check_in_date) != (validated.visit_date or validated.check_in_date):
        item.sort_order = next_order(db, user_id, validated)
    for key, value in fields.items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item


def delete(db: Session, item_id: int, user_id: int) -> None:
    db.scalar(select(models.User).where(models.User.id == user_id).with_for_update())
    db.delete(require_item(db, item_id, user_id))
    db.commit()


def import_local(
    db: Session, data: schemas.ItineraryImportRequest, user_id: int
) -> schemas.ItineraryImportResult:
    # Atomic and idempotent: retries cannot duplicate locally saved bookings.
    db.scalar(select(models.User).where(models.User.id == user_id).with_for_update())
    imported = 0
    existing = 0
    for entry in data.entries:
        marker = db.scalar(
            select(models.ItineraryImport.id).where(
                models.ItineraryImport.user_id == user_id,
                models.ItineraryImport.local_id == entry.local_id,
            )
        )
        if marker is not None:
            existing += 1
            continue
        trip = trips.for_booking(db, entry.item.trip_id, user_id)
        data_item = entry.item.model_copy(update={"trip_id": trip.id})
        trips.check_dates(trip, data_item)
        check_overlap(db, user_id, data_item)
        item = models.ItineraryItem(
            **data_item.model_dump(), user_id=user_id, sort_order=next_order(db, user_id, data_item)
        )
        db.add(item)
        db.flush()
        db.add(models.ItineraryImport(user_id=user_id, local_id=entry.local_id, item_id=item.id))
        db.flush()
        imported += 1
    db.commit()
    return schemas.ItineraryImportResult(imported=imported, already_imported=existing)
