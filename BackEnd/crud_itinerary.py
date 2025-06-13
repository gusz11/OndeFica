from sqlalchemy.orm import Session
from typing import List, Optional

import models
import schemas

def get_itinerary_item(db: Session, item_id: int, user_id: int) -> Optional[models.ItineraryItem]:
    """Busca um item específico do itinerário de um usuário."""
    return db.query(models.ItineraryItem).filter(models.ItineraryItem.id == item_id, models.ItineraryItem.user_id == user_id).first()

def get_itinerary_items_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[models.ItineraryItem]:
    """Busca todos os itens do itinerário de um usuário específico."""
    return db.query(models.ItineraryItem).filter(models.ItineraryItem.user_id == user_id).offset(skip).limit(limit).all()

def create_itinerary_item(db: Session, item: schemas.ItineraryItemCreate, user_id: int) -> models.ItineraryItem:
    """Cria um novo item no itinerário para um usuário."""
    db_item = models.ItineraryItem(**item.dict(), user_id=user_id)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def update_itinerary_item(db: Session, item_id: int, item_update: schemas.ItineraryItemUpdate, user_id: int) -> Optional[models.ItineraryItem]:
    """Atualiza um item do itinerário de um usuário."""
    db_item = get_itinerary_item(db, item_id, user_id)
    if db_item:
        update_data = item_update.dict(exclude_unset=True) 
        for key, value in update_data.items():
            setattr(db_item, key, value)
        db.commit()
        db.refresh(db_item)
    return db_item

def delete_itinerary_item(db: Session, item_id: int, user_id: int) -> Optional[models.ItineraryItem]:
    """Deleta um item do itinerário de um usuário."""
    db_item = get_itinerary_item(db, item_id, user_id)
    if db_item:
        db.delete(db_item)
        db.commit()
    return db_item 


def get_favorite_place(db: Session, favorite_id: int, user_id: int) -> Optional[models.FavoritePlace]:
    """Busca um favorito específico de um usuário."""
    return db.query(models.FavoritePlace).filter(models.FavoritePlace.id == favorite_id, models.FavoritePlace.user_id == user_id).first()

def get_favorite_places_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[models.FavoritePlace]:
    """Busca todos os favoritos de um usuário específico."""
    return db.query(models.FavoritePlace).filter(models.FavoritePlace.user_id == user_id).offset(skip).limit(limit).all()

def create_favorite_place(db: Session, favorite: schemas.FavoritePlaceCreate, user_id: int) -> models.FavoritePlace:
    """Adiciona um local aos favoritos de um usuário."""
    existing_favorite = db.query(models.FavoritePlace).filter(
        models.FavoritePlace.user_id == user_id,
        models.FavoritePlace.place_id_google == favorite.place_id_google
    ).first()
    if existing_favorite:
        return existing_favorite 
        
    db_favorite = models.FavoritePlace(**favorite.dict(), user_id=user_id)
    db.add(db_favorite)
    db.commit()
    db.refresh(db_favorite)
    return db_favorite

def delete_favorite_place_by_google_id(db: Session, place_id_google: str, user_id: int) -> Optional[models.FavoritePlace]:
    """Deleta um favorito de um usuário pelo place_id_google."""
    db_favorite = db.query(models.FavoritePlace).filter(
        models.FavoritePlace.user_id == user_id,
        models.FavoritePlace.place_id_google == place_id_google
    ).first()
    if db_favorite:
        db.delete(db_favorite)
        db.commit()
    return db_favorite