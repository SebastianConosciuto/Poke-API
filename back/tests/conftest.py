"""
pytest fixtures and a fake Supabase client.

The fake records every method call (table, select, eq, gte, ...) on a chain
so tests can both:
  * assert the right query was built
  * inject the response.data / response.count returned by .execute()

Use the `fake_supabase` fixture and `monkeypatch_supabase(table_data)` to
seed responses for a given test.
"""

from __future__ import annotations

import os
import sys
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional

import pytest

# ---------------------------------------------------------------------- #
# IMPORTANT: Set env + stub the real supabase client BEFORE the app imports.
# ---------------------------------------------------------------------- #

# Strip any inherited proxy env vars that break httpx in the test sandbox.
for _proxy_var in ("HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY",
                   "http_proxy", "https_proxy", "all_proxy"):
    os.environ.pop(_proxy_var, None)

os.environ.setdefault("SUPABASE_URL", "http://test.local")
os.environ.setdefault("SUPABASE_KEY", "test-key")
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-tests-only")

# Make the `app` package importable when running pytest from the back/ dir.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


# Stub `supabase.create_client` so app.database doesn't try to open a real connection
# at import time. We replace it with one that returns a placeholder; the real fake
# replacement happens per-test via the `fake_supabase` fixture.
class _PlaceholderSupabase:
    def table(self, name: str):
        raise RuntimeError(
            "Real supabase.table() called outside a test fixture. "
            "Make sure your test uses the fake_supabase fixture."
        )


import supabase as _supabase_module  # noqa: E402

_supabase_module.create_client = lambda *args, **kwargs: _PlaceholderSupabase()


# ---------------------------------------------------------------------- #
# Fake response object
# ---------------------------------------------------------------------- #

@dataclass
class FakeResponse:
    data: List[Dict[str, Any]] = field(default_factory=list)
    count: Optional[int] = None


# ---------------------------------------------------------------------- #
# Fake query chain
# ---------------------------------------------------------------------- #

class FakeQuery:
    """
    Chainable stub: every supabase query method returns self and records
    the call. .execute() returns whatever the parent FakeTable was told
    to return for this specific table.

    The `not_` accessor returns self so `.not_.is_(...)` works the same as
    in the real SDK.
    """

    def __init__(self, table_name: str, response_provider: Callable[[str, "FakeQuery"], FakeResponse]):
        self.table_name = table_name
        self._response_provider = response_provider
        self.calls: List[tuple] = []  # (method, args, kwargs)
        self._select_columns: Optional[str] = None

    # `not_` is a property in the real SDK; mimic that
    @property
    def not_(self) -> "FakeQuery":
        self.calls.append(("not_", (), {}))
        return self

    def _record(self, method: str, *args, **kwargs) -> "FakeQuery":
        self.calls.append((method, args, kwargs))
        if method == "select":
            self._select_columns = args[0] if args else None
        return self

    # Every supabase method we use anywhere in the codebase
    def select(self, *args, **kwargs) -> "FakeQuery":
        return self._record("select", *args, **kwargs)

    def insert(self, *args, **kwargs) -> "FakeQuery":
        return self._record("insert", *args, **kwargs)

    def update(self, *args, **kwargs) -> "FakeQuery":
        return self._record("update", *args, **kwargs)

    def delete(self, *args, **kwargs) -> "FakeQuery":
        return self._record("delete", *args, **kwargs)

    def eq(self, *args, **kwargs) -> "FakeQuery":
        return self._record("eq", *args, **kwargs)

    def neq(self, *args, **kwargs) -> "FakeQuery":
        return self._record("neq", *args, **kwargs)

    def is_(self, *args, **kwargs) -> "FakeQuery":
        return self._record("is_", *args, **kwargs)

    def gte(self, *args, **kwargs) -> "FakeQuery":
        return self._record("gte", *args, **kwargs)

    def lte(self, *args, **kwargs) -> "FakeQuery":
        return self._record("lte", *args, **kwargs)

    def in_(self, *args, **kwargs) -> "FakeQuery":
        return self._record("in_", *args, **kwargs)

    def contains(self, *args, **kwargs) -> "FakeQuery":
        return self._record("contains", *args, **kwargs)

    def order(self, *args, **kwargs) -> "FakeQuery":
        return self._record("order", *args, **kwargs)

    def range(self, *args, **kwargs) -> "FakeQuery":
        return self._record("range", *args, **kwargs)

    def execute(self) -> FakeResponse:
        return self._response_provider(self.table_name, self)


# ---------------------------------------------------------------------- #
# Fake supabase client
# ---------------------------------------------------------------------- #

class FakeSupabase:
    """
    Stand-in for the supabase Client. Tests configure responses with
    `set_response(table_name, response_or_callable)`. The callable form
    receives the FakeQuery so the test can return different responses
    depending on what was queried.
    """

    def __init__(self) -> None:
        self._responses: Dict[str, Any] = {}
        # All queries built during the test, keyed by table name
        self.queries: Dict[str, List[FakeQuery]] = {}

    def set_response(self, table_name: str, response: Any) -> None:
        """`response` can be a FakeResponse, a callable, or raw data list."""
        self._responses[table_name] = response

    def table(self, name: str) -> FakeQuery:
        q = FakeQuery(name, self._provide_response)
        self.queries.setdefault(name, []).append(q)
        return q

    def _provide_response(self, table_name: str, query: FakeQuery) -> FakeResponse:
        provided = self._responses.get(table_name)
        if provided is None:
            return FakeResponse(data=[])
        if callable(provided):
            return provided(query)
        if isinstance(provided, FakeResponse):
            return provided
        if isinstance(provided, list):
            return FakeResponse(data=provided)
        raise TypeError(f"Unsupported response type: {type(provided)}")



# ---------------------------------------------------------------------- #
# Fixtures
# ---------------------------------------------------------------------- #

@pytest.fixture
def fake_supabase(monkeypatch) -> FakeSupabase:
    """
    Replace the `supabase` global in every module that imports it from
    app.database. Returns the FakeSupabase instance for the test to configure.
    """
    fake = FakeSupabase()

    targets = [
        "app.database.supabase",
        "app.services.pokemon_service.supabase",
        "app.services.catch_service.supabase",
        "app.services.experience_service.supabase",
        "app.routers.auth.supabase",
    ]
    for target in targets:
        try:
            monkeypatch.setattr(target, fake, raising=False)
        except (ImportError, AttributeError):
            pass

    return fake
