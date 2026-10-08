import logging
from collections.abc import AsyncIterator, Awaitable, Callable
from contextlib import asynccontextmanager
from uuid import uuid4

import httpx
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.responses import Response
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from . import database, models  # noqa: F401
from .config import get_settings
from .routes import itinerary, places, trips, users
from .services.places import PlacesService

logger = logging.getLogger("ondefica")


class BodyLimitMiddleware:
    def __init__(self, app: ASGIApp, max_bytes: int = 131072) -> None:
        self.app = app
        self.max_bytes = max_bytes

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http" or scope["method"] not in {"POST", "PATCH", "PUT"}:
            await self.app(scope, receive, send)
            return
        body = bytearray()
        while True:
            message = await receive()
            if message["type"] == "http.disconnect":
                return
            body.extend(message.get("body", b""))
            if len(body) > self.max_bytes:
                await JSONResponse({"detail": "Payload muito grande"}, status_code=413)(scope, receive, send)
                return
            if not message.get("more_body", False):
                break
        delivered = False

        async def bounded_receive() -> Message:
            nonlocal delivered
            if not delivered:
                delivered = True
                return {"type": "http.request", "body": bytes(body), "more_body": False}
            return await receive()

        await self.app(scope, bounded_receive, send)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    if settings.auto_create_tables:
        database.Base.metadata.create_all(database.engine)
    async with httpx.AsyncClient(
        timeout=httpx.Timeout(12, connect=5), limits=httpx.Limits(max_connections=20)
    ) as client:
        app.state.places = PlacesService(client, settings)
        yield
    database.engine.dispose()


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="OndeFica API", version="2.0.0", lifespan=lifespan, debug=False)
    app.add_middleware(BodyLimitMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST", "PATCH", "DELETE"],
        allow_headers=["Authorization", "Content-Type"],
    )

    @app.middleware("http")
    async def request_headers(
        request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        request.state.request_id = str(uuid4())
        response = await call_next(request)
        response.headers["X-Request-ID"] = request.state.request_id
        response.headers["X-Content-Type-Options"] = "nosniff"
        if request.url.path.startswith(("/auth/", "/users/", "/itinerary", "/favorites", "/trips")):
            response.headers["Cache-Control"] = "no-store"
        return response

    @app.exception_handler(RequestValidationError)
    async def validation_error(_request: Request, exc: RequestValidationError) -> JSONResponse:
        # Pydantic's default error includes rejected input (including passwords). Omit it.
        errors = [{"loc": error["loc"], "msg": error["msg"], "type": error["type"]} for error in exc.errors()]
        return JSONResponse({"detail": errors}, status_code=422)

    @app.exception_handler(Exception)
    async def unexpected_error(request: Request, exc: Exception) -> JSONResponse:
        request_id = getattr(request.state, "request_id", str(uuid4()))
        # Exception strings can contain upstream URLs/secrets; log type and correlation ID only.
        logger.error("request_id=%s exception=%s", request_id, type(exc).__name__)
        return JSONResponse(
            {"detail": "Erro interno. Tente novamente mais tarde", "request_id": request_id},
            status_code=500,
            headers={"X-Request-ID": request_id, "X-Content-Type-Options": "nosniff"},
        )

    @app.get("/health", tags=["Health"])
    def health() -> dict[str, str]:
        return {"status": "ok"}

    app.include_router(users.router)
    app.include_router(itinerary.router)
    app.include_router(trips.router)
    app.include_router(places.router)
    return app


app = create_app()
