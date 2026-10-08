from typing import Annotated, cast

from fastapi import APIRouter, Depends, Query, Request, Response

from .. import auth, models, schemas
from ..services.places import PlacesService
from ..services.rate_limit import limit_photos, limit_places

router = APIRouter(tags=["Places"])


def get_places_service(request: Request) -> PlacesService:
    return cast(PlacesService, request.app.state.places)


Service = Annotated[PlacesService, Depends(get_places_service)]


@router.get("/api/pontos", response_model=list[schemas.Place], dependencies=[Depends(limit_places)])
async def places(service: Service, limit: Annotated[int, Query(ge=1, le=20)] = 10) -> list[schemas.Place]:
    return await service.places(limit)


@router.get("/api/pontos/{place_id}", response_model=schemas.Place, dependencies=[Depends(limit_places)])
async def place(place_id: schemas.PlaceId, service: Service) -> schemas.Place:
    return service.transform(place_id, await service.details(place_id))


@router.get(
    "/api/pontos/{place_id}/hotels", response_model=list[schemas.Hotel], dependencies=[Depends(limit_places)]
)
async def hotels(
    place_id: schemas.PlaceId, service: Service, limit: Annotated[int, Query(ge=1, le=10)] = 5
) -> list[schemas.Hotel]:
    return await service.hotels(place_id, limit)


@router.get("/api/photos", dependencies=[Depends(limit_photos)])
async def photo(token: Annotated[str, Query(min_length=1, max_length=8192)], service: Service) -> Response:
    content, media_type = await service.photo(token)
    return Response(content, media_type=media_type, headers={"Cache-Control": "public, max-age=300"})


@router.post("/admin/clear_cache", tags=["Admin"])
async def clear_cache(
    service: Service, _admin: Annotated[models.User, Depends(auth.get_admin_user)]
) -> dict[str, str]:
    service.clear()
    return {"message": "Cache limpo"}
