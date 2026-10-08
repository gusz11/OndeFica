"""Places API (New) adapter. Demo keys never request user-generated content."""

import asyncio
import re
from datetime import UTC, datetime, timedelta
from html import unescape
from math import asin, cos, radians, sin, sqrt
from typing import Literal
from urllib.parse import quote, urlencode, urlsplit

import httpx
import jwt
from cachetools import TTLCache
from fastapi import HTTPException
from pydantic import BaseModel, ConfigDict, Field, JsonValue, ValidationError

from .. import schemas
from ..config import Settings
from .place_data import BLOCKED_PLACES, MANUAL_PLACE_INFO

GOOGLE_BASE_URL = "https://places.googleapis.com/v1/"
PHOTO_NAME_PATTERN = re.compile(r"places/[A-Za-z0-9_-]+/photos/[A-Za-z0-9_+=-]+")
BASE_FIELDS = (
    "id",
    "displayName",
    "formattedAddress",
    "internationalPhoneNumber",
    "regularOpeningHours.weekdayDescriptions",
    "editorialSummary",
    "googleMapsUri",
    "websiteUri",
    "types",
    "location",
)
STANDARD_FIELDS = ("photos", "rating", "userRatingCount")


class GoogleSchema(BaseModel):
    model_config = ConfigDict(extra="ignore", populate_by_name=True)


class Location(GoogleSchema):
    lat: float = Field(alias="latitude", ge=-90, le=90, allow_inf_nan=False)
    lng: float = Field(alias="longitude", ge=-180, le=180, allow_inf_nan=False)


class LocalizedText(GoogleSchema):
    text: str = ""


class AuthorAttribution(GoogleSchema):
    display_name: str = Field(default="", alias="displayName")


class Photo(GoogleSchema):
    name: str = Field(max_length=4096, pattern=r"^places/[A-Za-z0-9_-]+/photos/[A-Za-z0-9_+=-]+$")
    authors: list[AuthorAttribution] = Field(default_factory=list, alias="authorAttributions")


class OpeningHours(GoogleSchema):
    weekday_text: list[str] = Field(default_factory=list, alias="weekdayDescriptions")


class GooglePlace(GoogleSchema):
    place_id: schemas.PlaceId | None = Field(default=None, alias="id")
    display_name: LocalizedText = Field(
        default_factory=lambda: LocalizedText(text="Local"), alias="displayName"
    )
    formatted_address: str | None = Field(default=None, alias="formattedAddress")
    international_phone_number: str | None = Field(default=None, alias="internationalPhoneNumber")
    opening_hours: OpeningHours = Field(default_factory=OpeningHours, alias="regularOpeningHours")
    photos: list[Photo] = Field(default_factory=list)
    editorial_summary: LocalizedText = Field(default_factory=LocalizedText, alias="editorialSummary")
    url: str | None = Field(default=None, alias="googleMapsUri")
    website: str | None = Field(default=None, alias="websiteUri")
    types: list[str] = Field(default_factory=list)
    location: Location | None = None
    rating: float | None = Field(default=None, ge=0, le=5, allow_inf_nan=False)
    user_ratings_total: int | None = Field(default=None, alias="userRatingCount", ge=0)


class GoogleSearchResponse(GoogleSchema):
    places: list[GooglePlace] = Field(default_factory=list)


def distance_km(first: Location, second: Location) -> float:
    lat1, lat2 = radians(first.lat), radians(second.lat)
    value = (
        sin(radians(second.lat - first.lat) / 2) ** 2
        + cos(lat1) * cos(lat2) * sin(radians(second.lng - first.lng) / 2) ** 2
    )
    return 6371 * 2 * asin(sqrt(min(1, max(0, value))))


class PlacesService:
    def __init__(self, client: httpx.AsyncClient, settings: Settings) -> None:
        self.client = client
        self.settings = settings
        self.details_cache: TTLCache[str, GooglePlace] = TTLCache(maxsize=200, ttl=900)
        self.lists_cache: TTLCache[str, list[schemas.Place]] = TTLCache(maxsize=100, ttl=300)
        self.photo_cache: TTLCache[str, tuple[bytes, str]] = TTLCache(maxsize=20, ttl=300)
        self.semaphore = asyncio.Semaphore(5)
        self.list_lock = asyncio.Lock()

    @property
    def demo(self) -> bool:
        return self.settings.google_places_mode == "demo"

    def api_key(self) -> str:
        key = self.settings.google_places_api_key
        if key is None or not key.get_secret_value():
            raise HTTPException(503, "Consulta de locais indisponível; configure o serviço no servidor")
        return key.get_secret_value()

    def field_mask(self, *, search: bool) -> str:
        fields = BASE_FIELDS if self.demo else BASE_FIELDS + STANDARD_FIELDS
        return ",".join(f"places.{field}" if search else field for field in fields)

    async def google(
        self,
        method: Literal["GET", "POST"],
        resource: str,
        *,
        search: bool = False,
        body: dict[str, JsonValue] | None = None,
        params: dict[str, str] | None = None,
    ) -> bytes:
        try:
            async with self.semaphore:
                response = await self.client.request(
                    method,
                    GOOGLE_BASE_URL + resource,
                    headers={
                        "X-Goog-Api-Key": self.api_key(),
                        "X-Goog-FieldMask": self.field_mask(search=search),
                    },
                    json=body,
                    params=params,
                    follow_redirects=False,
                )
                # Never forward Google's error payload: it can contain credential details.
                if response.status_code in {401, 403}:
                    raise HTTPException(
                        502,
                        "O Google recusou a consulta; confira a chave e as permissões da Places API (New)",
                    )
                if response.status_code == 429:
                    raise HTTPException(
                        503, "Cota de consultas ao Google atingida. Tente novamente mais tarde"
                    )
                if response.status_code == 404:
                    raise HTTPException(404, "Local não encontrado")
                if not response.is_success:
                    raise HTTPException(502, "Consulta ao provedor de locais indisponível")
                return response.content
        except httpx.HTTPError:
            raise HTTPException(502, "O provedor de locais não respondeu corretamente") from None

    async def search(
        self, resource: Literal["places:searchText", "places:searchNearby"], body: dict[str, JsonValue]
    ) -> list[GooglePlace]:
        content = await self.google("POST", resource, search=True, body=body)
        try:
            return GoogleSearchResponse.model_validate_json(content).places
        except ValidationError:
            raise HTTPException(502, "O provedor de locais não respondeu corretamente") from None

    async def details(self, place_id: str) -> GooglePlace:
        cached = self.details_cache.get(place_id)
        if cached is not None:
            return cached
        content = await self.google(
            "GET", f"places/{quote(place_id, safe='')}", params={"languageCode": "pt-BR"}
        )
        try:
            result = GooglePlace.model_validate_json(content)
        except ValidationError:
            raise HTTPException(502, "O provedor de locais não respondeu corretamente") from None
        if result.place_id != place_id:
            raise HTTPException(502, "O provedor de locais não respondeu corretamente")
        self.details_cache[place_id] = result
        return result

    def photo_url(self, reference: str) -> str:
        now = datetime.now(UTC)
        token = jwt.encode(
            {"ref": reference, "aud": "ondefica-photo", "exp": now + timedelta(hours=1), "iat": now},
            self.settings.jwt_secret_key.get_secret_value(),
            algorithm="HS256",
        )
        # Client sees a signed proxy URL, never the server's Google API key.
        return "/api/photos?" + urlencode({"token": token})

    def transform(self, place_id: str, data: GooglePlace) -> schemas.Place:
        manual = MANUAL_PLACE_INFO.get(place_id, {})
        description = data.editorial_summary.text or data.formatted_address or "Descrição indisponível"
        photo = data.photos[0] if data.photos and not self.demo else None
        coordinates = data.location
        return schemas.Place(
            id=place_id,
            title=data.display_name.text or "Local",
            description=manual.get("custom_description", description[:150]),
            longDescription=manual.get("custom_description", description),
            imageUrl=self.photo_url(photo.name) if photo else None,
            photoAttributions=[
                unescape(re.sub(r"<[^>]*>", "", author.display_name)) for author in photo.authors
            ]
            if photo
            else [],
            hours=manual.get("custom_hours", "\n".join(data.opening_hours.weekday_text) or "Consultar"),
            entryFee=manual.get("entry_fee", "Consultar"),
            phone_number=data.international_phone_number,
            formatted_address=data.formatted_address,
            Maps_url=data.url,
            website=data.website,
            types=data.types,
            latitude=coordinates.lat if coordinates else None,
            longitude=coordinates.lng if coordinates else None,
            rating=None if self.demo else data.rating,
            user_ratings_total=None if self.demo else data.user_ratings_total,
            category=manual.get("category", "N/A"),
            capacity=manual.get("capacity", "N/A"),
        )

    async def places(self, limit: int) -> list[schemas.Place]:
        # Single-flight and one search replace the previous search + N detail requests.
        async with self.list_lock:
            key = f"places:{limit}"
            cached = self.lists_cache.get(key)
            if cached is not None:
                return cached
            result = await self.search(
                "places:searchText",
                {
                    "textQuery": "atrações turísticas e monumentos em Brasília DF",
                    "includedType": "tourist_attraction",
                    "pageSize": 20,
                    "languageCode": "pt-BR",
                    "regionCode": "BR",
                },
            )
            candidates = [p for p in result if p.place_id and p.place_id not in BLOCKED_PLACES][:limit]
            places = []
            for candidate in candidates:
                if candidate.place_id is None:
                    continue
                self.details_cache[candidate.place_id] = candidate
                places.append(self.transform(candidate.place_id, candidate))
            self.lists_cache[key] = places
            return places

    async def hotels(self, place_id: str, limit: int) -> list[schemas.Hotel]:
        anchor = await self.details(place_id)
        location = anchor.location
        if location is None:
            return []
        result = await self.search(
            "places:searchNearby",
            {
                "includedTypes": ["lodging"],
                "maxResultCount": limit,
                "languageCode": "pt-BR",
                "rankPreference": "DISTANCE",
                "locationRestriction": {
                    "circle": {
                        "center": {"latitude": location.lat, "longitude": location.lng},
                        "radius": 5000.0,
                    }
                },
            },
        )
        hotels: list[schemas.Hotel] = []
        for hotel in result[:limit]:
            if hotel.place_id is None:
                continue
            place = self.transform(hotel.place_id, hotel)
            hotels.append(
                schemas.Hotel(
                    **place.model_dump(),
                    distance_km=distance_km(location, hotel.location) if hotel.location else None,
                )
            )
        return sorted(
            hotels, key=lambda hotel: hotel.distance_km if hotel.distance_km is not None else float("inf")
        )

    async def photo(self, token: str) -> tuple[bytes, str]:
        if self.demo:
            raise HTTPException(404, "Fotos indisponíveis no modo demo")
        try:
            claims = jwt.decode(
                token,
                self.settings.jwt_secret_key.get_secret_value(),
                algorithms=["HS256"],
                audience="ondefica-photo",
                options={"require": ["exp", "iat", "aud", "ref"]},
            )
            reference = claims["ref"]
            if (
                not isinstance(reference, str)
                or not 0 < len(reference) <= 4096
                or not PHOTO_NAME_PATTERN.fullmatch(reference)
            ):
                raise ValueError("Invalid photo resource")
        except (jwt.InvalidTokenError, ValueError, KeyError):
            raise HTTPException(403, "Foto inválida ou expirada") from None
        cached = self.photo_cache.get(reference)
        if cached is not None:
            return cached
        try:
            async with self.semaphore:
                response = await self.client.get(
                    GOOGLE_BASE_URL + quote(reference, safe="/") + "/media",
                    params={"maxWidthPx": "800"},
                    headers={"X-Goog-Api-Key": self.api_key()},
                    follow_redirects=False,
                )
            if response.status_code not in {301, 302, 303, 307, 308}:
                raise HTTPException(502, "Foto indisponível")
            target = response.headers.get("location", "")
            parsed = urlsplit(target)
            host = parsed.hostname or ""
            if (
                parsed.scheme != "https"
                or parsed.username is not None
                or parsed.password is not None
                or parsed.port not in {None, 443}
                or not any(
                    host == suffix or host.endswith("." + suffix)
                    for suffix in ("googleusercontent.com", "ggpht.com", "googleapis.com")
                )
            ):
                raise HTTPException(502, "Foto indisponível")
            # Validate redirect hosts, never forward the key, and cap binary response size.
            async with self.semaphore, self.client.stream("GET", target, follow_redirects=False) as image:
                image.raise_for_status()
                media_type = image.headers.get("content-type", "").split(";")[0]
                if media_type not in {"image/jpeg", "image/png", "image/webp"}:
                    raise HTTPException(502, "Foto indisponível")
                content = bytearray()
                async for chunk in image.aiter_bytes():
                    content.extend(chunk)
                    if len(content) > 5_000_000:
                        raise HTTPException(502, "Foto indisponível")
            value = (bytes(content), media_type)
            self.photo_cache[reference] = value
            return value
        except (httpx.HTTPError, ValueError):
            raise HTTPException(502, "Foto indisponível") from None

    def clear(self) -> None:
        self.details_cache.clear()
        self.lists_cache.clear()
        self.photo_cache.clear()
