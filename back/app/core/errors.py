"""
Shared error-handling helpers for routers.

Every router endpoint used to repeat:

    try:
        ...
        return await service_call(...)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to ...: {e}")

`@handle_route_errors("Failed to fetch Pokemon")` does exactly that, so
routers can stay one-liner thin.
"""

from functools import wraps
from typing import Callable

from fastapi import HTTPException, status

from app.core.logging import get_logger

logger = get_logger("router")


def handle_route_errors(error_message: str) -> Callable:
    """
    Wrap a router endpoint so that any non-HTTPException becomes a 500
    with a consistent message and a logged traceback.

    Usage:
        @router.get("/foo")
        @handle_route_errors("Failed to fetch foo")
        async def get_foo(...):
            return await foo_service.get_foo(...)
    """

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            try:
                return await func(*args, **kwargs)
            except HTTPException:
                raise
            except Exception as exc:
                logger.exception("%s: %s", error_message, exc)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"{error_message}: {exc}",
                )

        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except HTTPException:
                raise
            except Exception as exc:
                logger.exception("%s: %s", error_message, exc)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"{error_message}: {exc}",
                )

        # FastAPI cares whether the route is async — pick the right wrapper.
        import asyncio
        return async_wrapper if asyncio.iscoroutinefunction(func) else sync_wrapper

    return decorator
