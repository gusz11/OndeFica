import asyncio
import json
from typing import Literal
from urllib.parse import parse_qs, urlsplit

import httpx
import pytest
from BackEnd.config import Settings, get_settings
from BackEnd.services.places import Location, PlacesService, distance_km
from fastapi import HTTPException
from pydantic import SecretStr, ValidationError

PHOTO_NAME = "places/test-place/photos/photo-reference"


def settings_for(mode: Literal["demo", "standard"] = "demo") -> Settings:
    return get_settings().model_copy(
        update={"google_places_api_key": SecretStr("server-only-key"), "google_places_mode": mode}
    )


def token_for(service: PlacesService, reference: str = PHOTO_NAME) -> str:
    return parse_qs(urlsplit(service.photo_url(reference)).query)["token"][0]


def test_configuration_rejects_defaults_and_wildcard() -> None:
    with pytest.raises(ValidationError):
        Settings(jwt_secret_key="change-this-default-secret-0123456789")
    with pytest.raises(ValidationError):
        Settings(jwt_secret_key="test-only-key-0123456789-abcdefghijklmnopqrstuvwxyz", cors_origins=["*"])
    with pytest.raises(ValidationError):
        Settings(
            jwt_secret_key="test-only-key-0123456789-abcdefghijklmnopqrstuvwxyz", environment="production"
        )


def test_distance_at_zero_coordinates() -> None:
    assert distance_km(Location(lat=0, lng=0), Location(lat=0, lng=1)) == pytest.approx(111.195, rel=0.001)
    assert distance_km(Location(lat=0, lng=0), Location(lat=0, lng=180)) == pytest.approx(
        20015.087, rel=0.001
    )


@pytest.mark.parametrize("mode", ["demo", "standard"])
def test_places_single_flight_and_photo_proxy(mode: Literal["demo", "standard"]) -> None:
    async def scenario() -> None:
        calls: list[httpx.Request] = []

        def upstream(request: httpx.Request) -> httpx.Response:
            calls.append(request)
            return httpx.Response(
                200,
                json={
                    "places": [
                        {
                            "id": "test-place",
                            "displayName": {"text": "Museu"},
                            "formattedAddress": "Brasília DF",
                            "location": {"latitude": 0, "longitude": 0},
                            "regularOpeningHours": {"weekdayDescriptions": ["Segunda: 9h–18h"]},
                            "internationalPhoneNumber": "+55 61 1234-5678",
                            "websiteUri": "https://example.com",
                            "googleMapsUri": "https://maps.google.com/?q=museu",
                            "editorialSummary": {"text": "Museu histórico."},
                            "types": ["museum"],
                            "rating": 4.5,
                            "userRatingCount": 123,
                            "photos": [
                                {
                                    "name": PHOTO_NAME,
                                    "authorAttributions": [{"displayName": "Autor &amp; Co"}],
                                }
                            ],
                        }
                    ],
                },
            )

        settings = settings_for(mode)
        async with httpx.AsyncClient(transport=httpx.MockTransport(upstream)) as client:
            service = PlacesService(client, settings)
            first, second = await asyncio.gather(service.places(10), service.places(10))
            assert first == second and len(calls) == 1
            request = calls[0]
            assert request.method == "POST"
            assert str(request.url) == "https://places.googleapis.com/v1/places:searchText"
            assert request.headers["X-Goog-Api-Key"] == "server-only-key"
            fields = request.headers["X-Goog-FieldMask"].split(",")
            assert "*" not in fields and "places.displayName" in fields
            assert ("places.photos" in fields) == (mode == "standard")
            assert ("places.rating" in fields) == (mode == "standard")
            assert ("places.userRatingCount" in fields) == (mode == "standard")
            payload = json.loads(request.content)
            assert payload["languageCode"] == "pt-BR" and payload["pageSize"] == 20
            assert payload["includedType"] == "tourist_attraction"
            # Search includes detail fields; opening a listed place consumes no extra call.
            await service.details("test-place")
            assert len(calls) == 1
            place = first[0]
            assert place.latitude == place.longitude == 0
            assert place.title == "Museu" and place.hours == "Segunda: 9h–18h"
            assert place.description == "Museu histórico."
            assert place.phone_number == "+55 61 1234-5678"
            assert place.website == "https://example.com" and place.types == ["museum"]
            assert "server-only-key" not in place.model_dump_json()
            if mode == "standard":
                assert place.imageUrl and place.imageUrl.startswith("/api/photos?")
                assert place.photoAttributions == ["Autor & Co"]
                assert place.rating == 4.5 and place.user_ratings_total == 123
            else:
                assert place.imageUrl is None and not place.photoAttributions
                assert place.rating is None and place.user_ratings_total is None

    asyncio.run(scenario())


def test_photo_signature_and_redirect_host_validation() -> None:
    async def scenario() -> None:
        settings = settings_for("standard")
        calls: list[str] = []

        def upstream(request: httpx.Request) -> httpx.Response:
            calls.append(request.url.host)
            return httpx.Response(302, headers={"Location": "http://127.0.0.1/internal-secret"})

        async with httpx.AsyncClient(transport=httpx.MockTransport(upstream)) as client:
            service = PlacesService(client, settings)
            with pytest.raises(HTTPException) as invalid:
                await service.photo("unsigned")
            assert invalid.value.status_code == 403 and not calls
            token = token_for(service)
            with pytest.raises(HTTPException) as redirect:
                await service.photo(token)
            assert redirect.value.status_code == 502
            assert calls == ["places.googleapis.com"]

    asyncio.run(scenario())


@pytest.mark.parametrize("upstream_status,expected", [(400, 502), (403, 502), (429, 503), (500, 502)])
def test_upstream_failure_is_not_an_empty_success(upstream_status: int, expected: int) -> None:
    async def scenario() -> None:
        settings = settings_for()
        async with httpx.AsyncClient(
            transport=httpx.MockTransport(
                lambda _r: httpx.Response(upstream_status, json={"error": {"message": "secret-key-invalid"}})
            )
        ) as client:
            with pytest.raises(HTTPException) as failure:
                await PlacesService(client, settings).places(10)
            assert failure.value.status_code == expected
            assert "secret-key-invalid" not in failure.value.detail

    asyncio.run(scenario())


def test_demo_configuration_and_photo_guard() -> None:
    with pytest.raises(ValidationError):
        Settings(google_places_mode="legacy")

    async def scenario() -> None:
        calls: list[httpx.Request] = []

        def upstream(request: httpx.Request) -> httpx.Response:
            calls.append(request)
            return httpx.Response(500)

        async with httpx.AsyncClient(transport=httpx.MockTransport(upstream)) as client:
            service = PlacesService(client, settings_for())
            with pytest.raises(HTTPException) as failure:
                await service.photo(token_for(service))
            assert failure.value.status_code == 404 and not calls

    asyncio.run(scenario())


def test_nearby_hotels_new_payload_and_distance_sorting() -> None:
    async def scenario() -> None:
        calls: list[httpx.Request] = []

        def upstream(request: httpx.Request) -> httpx.Response:
            calls.append(request)
            if request.method == "GET":
                assert request.url.path == "/v1/places/anchor"
                assert request.url.params["languageCode"] == "pt-BR"
                assert "places.displayName" not in request.headers["X-Goog-FieldMask"]
                return httpx.Response(200, json={"id": "anchor", "location": {"latitude": 0, "longitude": 0}})
            assert request.url.path == "/v1/places:searchNearby"
            payload = json.loads(request.content)
            assert payload["includedTypes"] == ["lodging"] and payload["maxResultCount"] == 5
            assert payload["rankPreference"] == "DISTANCE"
            assert payload["locationRestriction"]["circle"] == {
                "center": {"latitude": 0.0, "longitude": 0.0},
                "radius": 5000.0,
            }
            return httpx.Response(
                200,
                json={
                    "places": [
                        {
                            "id": "far",
                            "displayName": {"text": "Hotel distante"},
                            "location": {"latitude": 0.01, "longitude": 0},
                        },
                        {
                            "id": "near",
                            "displayName": {"text": "Hotel perto"},
                            "location": {"latitude": 0.001, "longitude": 0},
                        },
                    ]
                },
            )

        async with httpx.AsyncClient(transport=httpx.MockTransport(upstream)) as client:
            hotels = await PlacesService(client, settings_for()).hotels("anchor", 5)
            assert [hotel.id for hotel in hotels] == ["near", "far"]
            assert hotels[0].distance_km == pytest.approx(0.111195, rel=0.001)
            assert hotels[0].imageUrl is None and len(calls) == 2

    asyncio.run(scenario())


@pytest.mark.parametrize(
    "payload",
    [b"invalid-json", b'{"places":"secret"}', b'{"places":[{"location":{"latitude":91,"longitude":0}}]}'],
)
def test_malformed_google_response_is_safe(payload: bytes) -> None:
    async def scenario() -> None:
        async with httpx.AsyncClient(
            transport=httpx.MockTransport(lambda _r: httpx.Response(200, content=payload))
        ) as client:
            with pytest.raises(HTTPException) as failure:
                await PlacesService(client, settings_for()).places(10)
            assert failure.value.status_code == 502 and "secret" not in failure.value.detail

    asyncio.run(scenario())


def test_empty_results_missing_key_and_missing_location() -> None:
    async def scenario() -> None:
        calls: list[httpx.Request] = []

        def upstream(request: httpx.Request) -> httpx.Response:
            calls.append(request)
            return httpx.Response(200, json={"id": "anchor"} if request.method == "GET" else {})

        async with httpx.AsyncClient(transport=httpx.MockTransport(upstream)) as client:
            service = PlacesService(client, settings_for())
            assert await service.places(10) == []
            assert await service.hotels("anchor", 5) == []
            assert len(calls) == 2
            without_key = settings_for().model_copy(update={"google_places_api_key": None})
            with pytest.raises(HTTPException) as failure:
                await PlacesService(client, without_key).places(10)
            assert failure.value.status_code == 503 and len(calls) == 2

    asyncio.run(scenario())


@pytest.mark.parametrize("reference", ["places/id/photos/../secret", "https://evil.com/p", "ref"])
def test_signed_invalid_photo_resource_is_rejected(reference: str) -> None:
    async def scenario() -> None:
        calls: list[httpx.Request] = []

        def upstream(request: httpx.Request) -> httpx.Response:
            calls.append(request)
            return httpx.Response(500)

        async with httpx.AsyncClient(transport=httpx.MockTransport(upstream)) as client:
            service = PlacesService(client, settings_for("standard"))
            with pytest.raises(HTTPException) as failure:
                await service.photo(token_for(service, reference))
            assert failure.value.status_code == 403 and not calls

    asyncio.run(scenario())


@pytest.mark.parametrize(
    "media_type,size,expected",
    [("image/jpeg", 4, None), ("text/html", 4, 502), ("image/jpeg", 5_000_001, 502)],
)
def test_new_photo_download_does_not_forward_key(media_type: str, size: int, expected: int | None) -> None:
    async def scenario() -> None:
        calls: list[httpx.Request] = []

        def upstream(request: httpx.Request) -> httpx.Response:
            calls.append(request)
            if request.url.host == "places.googleapis.com":
                assert request.url.path == f"/v1/{PHOTO_NAME}/media"
                assert request.url.params["maxWidthPx"] == "800"
                assert "key" not in request.url.params
                assert request.headers["X-Goog-Api-Key"] == "server-only-key"
                return httpx.Response(302, headers={"Location": "https://lh3.googleusercontent.com/image"})
            assert "X-Goog-Api-Key" not in request.headers
            return httpx.Response(200, content=b"a" * size, headers={"content-type": media_type})

        async with httpx.AsyncClient(transport=httpx.MockTransport(upstream)) as client:
            service = PlacesService(client, settings_for("standard"))
            token = token_for(service)
            if expected is not None:
                with pytest.raises(HTTPException) as failure:
                    await service.photo(token)
                assert failure.value.status_code == expected
            else:
                assert await service.photo(token) == (b"aaaa", "image/jpeg")
                assert await service.photo(token) == (b"aaaa", "image/jpeg")
            assert len(calls) == 2

    asyncio.run(scenario())
