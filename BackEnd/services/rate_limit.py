"""Bounded per-process limits. Use a shared gateway/Redis limiter for multiple workers."""

from collections import deque
from threading import Lock
from time import monotonic

from fastapi import HTTPException, Request


class RateLimiter:
    def __init__(self, max_keys: int = 10000) -> None:
        self.events: dict[str, deque[float]] = {}
        self.lock = Lock()
        self.max_keys = max_keys

    def check(self, request: Request, bucket: str, limit: int, window: int = 60) -> None:
        # Do not trust client-supplied X-Forwarded-For; configure trusted proxies in Uvicorn.
        host = request.client.host if request.client else "unknown"
        key = f"{bucket}:{host}"
        now = monotonic()
        with self.lock:
            if key not in self.events and len(self.events) >= self.max_keys:
                stale = [k for k, events in self.events.items() if not events or events[-1] <= now - window]
                for old in stale:
                    self.events.pop(old)
                if len(self.events) >= self.max_keys:
                    raise HTTPException(
                        429, "Tente novamente em instantes", headers={"Retry-After": str(window)}
                    )
            events = self.events.setdefault(key, deque())
            while events and events[0] <= now - window:
                events.popleft()
            if len(events) >= limit:
                raise HTTPException(
                    429,
                    "Muitas requisições. Tente novamente em instantes",
                    headers={"Retry-After": str(window)},
                )
            events.append(now)


limiter = RateLimiter()


def limit_auth(request: Request) -> None:
    limiter.check(request, "auth", 10)


def limit_places(request: Request) -> None:
    limiter.check(request, "places", 30)


def limit_photos(request: Request) -> None:
    limiter.check(request, "photos", 120)
