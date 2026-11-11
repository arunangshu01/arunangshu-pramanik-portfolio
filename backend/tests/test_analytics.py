import pytest
import routers.analytics as analytics_router
from utility.analytics import tracker


@pytest.fixture(autouse=True)
def reset_analytics():
    analytics_router.rate_limiter.clear()
    tracker.reset()
    yield
    tracker.reset()


def test_track_event(client, api_base):
    res = client.post(f"{api_base}/analytics/track",
                      json={"event": "page_view", "page": "/about"})
    assert res.status_code == 201
    assert tracker.summary()["counts"]["page_view"] == 1


def test_track_event_validation(client, api_base):
    res = client.post(f"{api_base}/analytics/track", json={"page": "/about"})
    assert res.status_code == 422


def test_summary_unavailable_without_token_config(client, api_base, monkeypatch):
    monkeypatch.setattr(analytics_router, "ANALYTICS_ADMIN_TOKEN", None)
    res = client.get(f"{api_base}/analytics/summary")
    assert res.status_code == 503


def test_summary_rejects_wrong_token(client, api_base, monkeypatch):
    monkeypatch.setattr(analytics_router, "ANALYTICS_ADMIN_TOKEN", "secret-token")
    res = client.get(f"{api_base}/analytics/summary")
    assert res.status_code == 401
    res = client.get(f"{api_base}/analytics/summary",
                     headers={"X-Admin-Token": "wrong"})
    assert res.status_code == 401


def test_summary_with_token(client, api_base, monkeypatch):
    monkeypatch.setattr(analytics_router, "ANALYTICS_ADMIN_TOKEN", "secret-token")
    client.post(f"{api_base}/analytics/track", json={"event": "page_view", "page": "/"})
    res = client.get(f"{api_base}/analytics/summary",
                     headers={"X-Admin-Token": "secret-token"})
    assert res.status_code == 200
    body = res.json()
    assert body["counts"]["page_view"] == 1
    assert body["total_events"] == 1
    assert len(body["recent_events"]) == 1


def test_track_rate_limited(client, api_base):
    limit = analytics_router.rate_limiter._max_requests
    for _ in range(limit):
        res = client.post(f"{api_base}/analytics/track", json={"event": "section_view"})
        assert res.status_code == 201
    res = client.post(f"{api_base}/analytics/track", json={"event": "section_view"})
    assert res.status_code == 429


@pytest.mark.parametrize("body", [
    {"event": "hire_someone_else"},
    {"event": "page_view", "metadata": {"Bad-Key": "x"}},
    {"event": "page_view", "metadata": {"nested": {"a": 1}}},
    {"event": "page_view", "metadata": {"referrer": "x" * 257}},
    {"event": "page_view", "metadata": {f"k_{chr(97 + i)}": i for i in range(9)}},
    {"event": "page_view", "unexpected": True},
])
def test_track_rejects_unknown_events_and_unbounded_metadata(client, api_base, body):
    assert client.post(f"{api_base}/analytics/track", json=body).status_code == 422
    assert tracker.summary()["total_events"] == 0


def test_forged_forwarded_for_does_not_bypass_rate_limit(client, api_base, monkeypatch):
    monkeypatch.setattr("utility.settings.CLIENT_IP_PROXY_HOPS", 1)
    limit = analytics_router.rate_limiter._max_requests
    for i in range(limit + 1):
        res = client.post(f"{api_base}/analytics/track", json={"event": "section_view"},
                          headers={"X-Forwarded-For": f"198.51.100.{i}, 203.0.113.7, 35.191.0.1"})
    assert res.status_code == 429


def test_global_cap_bounds_requests_across_clients(client, api_base, monkeypatch):
    from utility.rate_limit import InMemoryRateLimiter
    monkeypatch.setattr(analytics_router, "rate_limiter",
                        InMemoryRateLimiter(max_requests=100, window_seconds=60, global_max_requests=3))
    monkeypatch.setattr(analytics_router, "client_ip", lambda request: str(id(request)))
    codes = [client.post(f"{api_base}/analytics/track", json={"event": "section_view"}).status_code
             for _ in range(4)]
    assert codes == [201, 201, 201, 429]


def test_resume_view_auto_tracked(client, api_base):
    client.get(f"{api_base}/resume/view")
    assert tracker.summary()["counts"].get("resume_view") == 1
