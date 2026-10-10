"""Smoke tests at the FastAPI HTTP seam.

These exist to prove the app imports and serves on the current runtime
(Python 3.12) without behavioral change — not to exercise DynamoDB/Cognito.
The /announcements endpoint is static (no AWS), so it is a clean smoke target;
the other routers are asserted to be *mounted* (routed, not 404) without
depending on AWS.
"""

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)
# Don't raise on handler exceptions — AWS-dependent routes may 500 locally; we
# only care that they are routed (not 404).
routed = TestClient(app, raise_server_exceptions=False)


def test_announcements_endpoint_returns_payload():
    response = client.get("/announcements")
    assert response.status_code == 200
    body = response.json()
    assert "announcements" in body
    assert body["announcements"], "expected at least one announcement"
    assert body["announcements"][0]["title"]


def test_all_routers_are_mounted():
    # A representative path from each router — not 404 means it is routed.
    assert routed.get("/announcements").status_code == 200
    assert routed.get("/progress/latest").status_code != 404
    assert routed.get("/auth/user/settings").status_code != 404
