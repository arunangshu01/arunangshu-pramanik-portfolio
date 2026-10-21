import pytest
import routers.analytics as analytics_router
from utility.analytics import tracker


@pytest.fixture(autouse=True)
def reset_analytics():
    analytics_router.rate_limiter._hits.clear()
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
    for i in range(limit):
        res = client.post(f"{api_base}/analytics/track", json={"event": f"e{i}"})
        assert res.status_code == 201
    res = client.post(f"{api_base}/analytics/track", json={"event": "overflow"})
    assert res.status_code == 429


def test_resume_view_auto_tracked(client, api_base):
    client.get(f"{api_base}/resume/view")
    assert tracker.summary()["counts"].get("resume_view") == 1
