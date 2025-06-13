# OndeFicaBack/schemas.py
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Any
from datetime import datetime
from enum import Enum 
from models import ItineraryItemType

class GoogleIdToken(BaseModel):
    id_token: str

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        orm_mode = True 

class ItineraryItemBase(BaseModel):
    place_id_google: Optional[str] = None
    place_title: str
    item_type: ItineraryItemType
    
    visit_date: Optional[str] = None 
    number_of_people: Optional[int] = Field(None, ge=1) 
    
    check_in_date: Optional[str] = None 
    check_out_date: Optional[str] = None 

    image_url: Optional[str] = None
    formatted_address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    custom_notes: Optional[str] = None

class ItineraryItemCreate(ItineraryItemBase):
    pass 

class ItineraryItemUpdate(BaseModel):
    place_title: Optional[str] = None
    visit_date: Optional[str] = None
    number_of_people: Optional[int] = Field(None, ge=1)
    check_in_date: Optional[str] = None
    check_out_date: Optional[str] = None
    image_url: Optional[str] = None
    formatted_address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    custom_notes: Optional[str] = None

class ItineraryItemResponse(ItineraryItemBase):
    id: int
    user_id: int
    created_at: datetime
    class Config:
        orm_mode = True

class FavoritePlaceBase(BaseModel):
    place_id_google: str
    place_title: Optional[str] = None

class FavoritePlaceCreate(FavoritePlaceBase):
    pass

class FavoritePlaceResponse(FavoritePlaceBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        orm_mode = True


class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[int] = None 
