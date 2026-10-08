from datetime import date, datetime
from typing import Annotated, Literal, Self
from urllib.parse import urlsplit

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    StringConstraints,
    field_validator,
    model_validator,
)

from .models import ItineraryItemType

PlaceId = Annotated[str, StringConstraints(min_length=1, max_length=255, pattern=r"^[A-Za-z0-9_-]+$")]
Title = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)]
ISODate = Annotated[str, StringConstraints(pattern=r"^\d{4}-\d{2}-\d{2}$")]
ClockTime = Annotated[str, StringConstraints(pattern=r"^(?:[01]\d|2[0-3]):[0-5]\d$")]


class TripBase(BaseModel):
    model_config = ConfigDict(extra="forbid", from_attributes=True)
    name: Title
    start_date: ISODate | None = None
    end_date: ISODate | None = None

    @model_validator(mode="after")
    def dates(self) -> Self:
        if (self.start_date is None) != (self.end_date is None):
            raise ValueError("Informe início e fim da viagem, ou deixe ambos vazios")
        if self.start_date and self.end_date:
            date.fromisoformat(self.start_date)
            date.fromisoformat(self.end_date)
            if self.end_date < self.start_date:
                raise ValueError("O fim da viagem não pode ser anterior ao início")
        return self


class Schema(BaseModel):
    model_config = ConfigDict(extra="forbid", from_attributes=True, allow_inf_nan=False)


class GoogleIdToken(Schema):
    id_token: str = Field(min_length=1, max_length=8192)


class UserBase(Schema):
    email: EmailStr
    full_name: str | None = Field(default=None, min_length=1, max_length=120)

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, value: object) -> object:
        return value.strip().lower() if isinstance(value, str) else value

    @field_validator("full_name")
    @classmethod
    def validate_name(cls, value: str | None) -> str | None:
        if value is not None:
            value = value.strip()
            if not value or any(ord(char) < 32 for char in value):
                raise ValueError("Nome inválido")
        return value


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime


class TripCreate(TripBase):
    pass


class TripUpdate(Schema):
    name: Title | None = None
    start_date: ISODate | None = None
    end_date: ISODate | None = None


class TripResponse(TripBase):
    id: int
    user_id: int
    created_at: datetime


class DayOrder(Schema):
    item_ids: list[Annotated[int, Field(gt=0, strict=True)]] = Field(min_length=1, max_length=500)

    @field_validator("item_ids")
    @classmethod
    def unique_ids(cls, value: list[int]) -> list[int]:
        if len(value) != len(set(value)):
            raise ValueError("A ordem não pode repetir itens")
        return value


class ItineraryItemBase(Schema):
    trip_id: int | None = Field(default=None, gt=0, strict=True)
    place_id_google: PlaceId | None = None
    place_title: Title
    item_type: ItineraryItemType
    visit_date: ISODate | None = None
    number_of_people: int | None = Field(default=None, ge=1, le=1000, strict=True)
    start_time: ClockTime | None = None
    duration_minutes: int | None = Field(default=None, ge=1, le=1440, strict=True)
    check_in_date: ISODate | None = None
    check_out_date: ISODate | None = None
    image_url: str | None = Field(default=None, max_length=4096)
    formatted_address: str | None = Field(default=None, max_length=500)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    custom_notes: str | None = Field(default=None, max_length=2000)

    @field_validator("visit_date", "check_in_date", "check_out_date")
    @classmethod
    def calendar_date(cls, value: str | None) -> str | None:
        if value:
            date.fromisoformat(value)
        return value

    @field_validator("image_url")
    @classmethod
    def safe_image(cls, value: str | None) -> str | None:
        if value:
            parsed = urlsplit(value)
            if not value.startswith("/api/photos?") and (
                parsed.scheme != "https" or not parsed.netloc or parsed.username
            ):
                raise ValueError("Imagem exige HTTPS ou o proxy de fotos da API")
            if "key=" in value.lower():
                raise ValueError("URLs com chave de API não podem ser persistidas")
        return value

    @model_validator(mode="after")
    def validate_booking(self) -> Self:
        if (self.start_time is None) != (self.duration_minutes is None):
            raise ValueError("Informe horário e duração juntos, ou deixe ambos vazios")
        if self.start_time and self.duration_minutes:
            hours, minutes = map(int, self.start_time.split(":"))
            if hours * 60 + minutes + self.duration_minutes > 1440:
                raise ValueError("A visita deve terminar no mesmo dia")
        if (self.latitude is None) != (self.longitude is None):
            raise ValueError("Informe as duas coordenadas")
        if self.item_type == ItineraryItemType.place:
            if not self.visit_date or self.number_of_people is None:
                raise ValueError("Visitas exigem data e quantidade de pessoas")
            if self.check_in_date or self.check_out_date:
                raise ValueError("Visitas não possuem datas de hospedagem")
        else:
            if not self.check_in_date or not self.check_out_date or self.check_out_date <= self.check_in_date:
                raise ValueError("Check-out deve ser posterior ao check-in")
            if self.visit_date or self.number_of_people is not None or self.start_time is not None:
                raise ValueError("Hospedagem não possui dados de visita")
        return self


class ItineraryItemCreate(ItineraryItemBase):
    pass


class ItineraryItemUpdate(Schema):
    place_title: Title | None = None
    visit_date: ISODate | None = None
    number_of_people: int | None = Field(default=None, ge=1, le=1000, strict=True)
    start_time: ClockTime | None = None
    duration_minutes: int | None = Field(default=None, ge=1, le=1440, strict=True)
    check_in_date: ISODate | None = None
    check_out_date: ISODate | None = None
    custom_notes: str | None = Field(default=None, max_length=2000)
    # Service revalidates the merged object, including explicit nulls and date order.


class ItineraryItemResponse(ItineraryItemBase):
    id: int
    user_id: int
    created_at: datetime
    sort_order: int = Field(default=0, ge=0)


class ItineraryImportEntry(Schema):
    local_id: str = Field(min_length=1, max_length=255)
    item: ItineraryItemCreate


class ItineraryImportRequest(Schema):
    entries: list[ItineraryImportEntry] = Field(min_length=1, max_length=100)


class ItineraryImportResult(Schema):
    imported: int
    already_imported: int


class FavoritePlaceCreate(Schema):
    place_id_google: PlaceId
    place_title: Title | None = None


class FavoritePlaceResponse(FavoritePlaceCreate):
    id: int
    user_id: int
    created_at: datetime


class Token(Schema):
    access_token: str
    token_type: Literal["bearer"] = "bearer"


class Place(Schema):
    id: str
    title: str
    description: str
    imageUrl: str | None = None
    photoAttributions: list[str] = Field(default_factory=list)
    longDescription: str | None = None
    hours: str = "Consultar"
    entryFee: str = "Consultar"
    phone_number: str | None = None
    formatted_address: str | None = None
    Maps_url: str | None = None
    types: list[str] = Field(default_factory=list)
    latitude: float | None = None
    longitude: float | None = None
    rating: float | None = None
    user_ratings_total: int | None = None
    website: str | None = None
    category: str = "N/A"
    capacity: str = "N/A"


class Hotel(Place):
    distance_km: float | None = None
