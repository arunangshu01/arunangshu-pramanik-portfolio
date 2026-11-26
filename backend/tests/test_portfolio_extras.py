import asyncio
import time
from datetime import date
from unittest.mock import AsyncMock, patch

import pytest

import routers.guestbook as guestbook_router
import source.coding_activity as activity
import source.now_status as now_status
import utility.admin_auth as admin_auth
from utility.analytics_sink import BigQueryAnalyticsSink
from utility.guestbook import guestbook_store

TOKEN = "secret-token"
ADMIN = {"X-Admin-Token": TOKEN}


@pytest.fixture(autouse=True)
def reset_state(monkeypatch):
    monkeypatch.setattr(admin_auth, "ANALYTICS_ADMIN_TOKEN", TOKEN)
    guestbook_router.rate_limiter.clear()
    guestbook_store.reset()
    now_status.override_store.clear()
    activity.clear_cache()
    yield
    guestbook_store.reset()
    now_status.override_store.clear()
    activity.clear_cache()


# ---------- now status ----------

def test_status_serves_committed_default(client, api_base):
    res = client.get(f"{api_base}/status")
    assert res.status_code == 200
    assert res.json()["kind"] in {"building", "reading", "learning", "exploring", "listening"}
    assert res.headers["cache-control"] == "public, max-age=60"


def test_status_default_points_at_ask_the_multiverse(client, api_base):
    body = client.get(f"{api_base}/status").json()
    assert body["kind"] == "building"
    assert body["label"] == "Ask the Multiverse - cited Marvel multiverse Q&A"
    assert body["url"] == "https://multiverse.arunangshupramanik.com/"


def test_status_update_requires_token(client, api_base, monkeypatch):
    body = {"kind": "reading", "label": "DDIA"}
    assert client.put(f"{api_base}/status", json=body).status_code == 401
    assert client.put(f"{api_base}/status", json=body,
                      headers={"X-Admin-Token": "wrong"}).status_code == 401
    monkeypatch.setattr(admin_auth, "ANALYTICS_ADMIN_TOKEN", None)
    assert client.put(f"{api_base}/status", json=body, headers=ADMIN).status_code == 503


def test_status_non_ascii_token_is_401_not_500(client, api_base):
    res = client.put(f"{api_base}/status", json={"kind": "reading", "label": "x"},
                     headers={"X-Admin-Token": "tökén".encode()})
    assert res.status_code == 401


def test_status_override_persists_and_resets(client, api_base):
    default = client.get(f"{api_base}/status").json()
    res = client.put(f"{api_base}/status", headers=ADMIN,
                     json={"kind": "reading", "label": "  Designing   Data-Intensive Apps ",
                           "url": "https://dataintensive.net"})
    assert res.status_code == 200
    assert res.json()["label"] == "Designing Data-Intensive Apps"
    assert res.json()["updated_at"]
    assert client.get(f"{api_base}/status").json()["kind"] == "reading"
    reset = client.delete(f"{api_base}/status", headers=ADMIN)
    assert reset.status_code == 200
    assert client.get(f"{api_base}/status").json() == default


@pytest.mark.parametrize("url", ["javascript:alert(1)", "data:text/html,x", "ftp://x"])
def test_status_rejects_non_http_urls(client, api_base, url):
    res = client.put(f"{api_base}/status", headers=ADMIN,
                     json={"kind": "building", "label": "x", "url": url})
    assert res.status_code == 422


def test_status_falls_back_to_default_when_override_store_fails(client, api_base):
    with patch.object(now_status.override_store, "get", side_effect=RuntimeError("down")):
        res = client.get(f"{api_base}/status")
    assert res.status_code == 200


# ---------- guestbook ----------

def test_guestbook_sign_returns_entry_and_lists_it(client, api_base):
    res = client.post(f"{api_base}/guestbook", json={"name": "Ada", "message": "Great site!"})
    assert res.status_code == 201
    entry = res.json()["entry"]
    assert entry["id"] and entry["name"] == "Ada" and entry["created_at"]
    listed = client.get(f"{api_base}/guestbook").json()["entries"]
    assert listed[0]["id"] == entry["id"]


@pytest.mark.parametrize("message", ["visit https://spam.example", "see www.spam.com",
                                     "buy at cheap-pills.xyz"])
def test_guestbook_rejects_links(client, api_base, message):
    res = client.post(f"{api_base}/guestbook", json={"name": "Bot", "message": message})
    assert res.status_code == 422


def test_guestbook_honeypot_stores_nothing(client, api_base):
    res = client.post(f"{api_base}/guestbook",
                      json={"name": "Bot", "message": "hello", "website": "x"})
    assert res.status_code == 201 and res.json()["entry"] is None
    assert client.get(f"{api_base}/guestbook").json()["entries"] == []


def test_guestbook_strips_control_and_bidi_characters(client, api_base):
    res = client.post(f"{api_base}/guestbook",
                      json={"name": "Ada\u202e", "message": "hi\x1b[2J there"})
    assert res.status_code == 201
    assert res.json()["entry"]["name"] == "Ada"
    assert "\x1b" not in res.json()["entry"]["message"]


@pytest.mark.parametrize("body", [{"name": "", "message": "x"}, {"name": "x", "message": "  "},
                                  {"name": "x", "message": "m" * 281},
                                  {"name": "x", "message": "y", "extra": 1}])
def test_guestbook_validation(client, api_base, body):
    assert client.post(f"{api_base}/guestbook", json=body).status_code == 422


def test_guestbook_rate_limit(client, api_base):
    for i in range(3):
        assert client.post(f"{api_base}/guestbook",
                           json={"name": "A", "message": f"note {i}"}).status_code == 201
    res = client.post(f"{api_base}/guestbook", json={"name": "A", "message": "again"})
    assert res.status_code == 429 and res.headers["retry-after"] == "60"


def test_guestbook_admin_delete(client, api_base):
    entry_id = client.post(f"{api_base}/guestbook",
                           json={"name": "A", "message": "delete me"}).json()["entry"]["id"]
    assert client.delete(f"{api_base}/guestbook/{entry_id}").status_code == 401
    assert client.delete(f"{api_base}/guestbook/{entry_id}", headers=ADMIN).status_code == 200
    assert client.get(f"{api_base}/guestbook").json()["entries"] == []
    assert client.delete(f"{api_base}/guestbook/{entry_id}", headers=ADMIN).status_code == 404
    assert client.delete(f"{api_base}/guestbook/bad.id!", headers=ADMIN).status_code == 404


def test_guestbook_read_failure_is_503(client, api_base):
    with patch.object(guestbook_store, "entries", side_effect=RuntimeError("down")):
        assert client.get(f"{api_base}/guestbook").status_code == 503


# ---------- notes ----------

def test_notes_list_and_exact_lookup(client, api_base):
    notes = client.get(f"{api_base}/notes").json()["notes"]
    assert notes and {"id", "title", "date", "excerpt"} == set(notes[0])
    note_id = notes[0]["id"]
    note = client.get(f"{api_base}/notes/{note_id}").json()
    assert note["id"] == note_id and note["markdown"]
    assert not note["markdown"].startswith("# "), "title heading is stripped from the body"


@pytest.mark.parametrize("note_id", ["sink", "analytics-sink", "UPPER", "a..b", "x" * 81, "-x"])
def test_notes_partial_or_malformed_ids_are_404(client, api_base, note_id):
    assert client.get(f"{api_base}/notes/{note_id}").status_code == 404


def test_notes_path_traversal_is_rejected(client, api_base):
    assert client.get(f"{api_base}/notes/..%2F..%2Fapp").status_code == 404


# ---------- github / activity ----------

EVENTS = [
    {"type": "PushEvent", "repo": {"name": "u/flowbench"}, "created_at": "2026-11-15T10:00:00Z",
     "payload": {"ref": "refs/heads/main", "size": 2}},
    {"type": "PushEvent", "repo": {"name": "u/flowbench"}, "created_at": "2026-11-15T09:00:00Z",
     "payload": {"ref": "refs/heads/main"}},
    {"type": "PushEvent", "repo": {"name": "u/doppel"}, "created_at": "2026-11-14T09:00:00Z",
     "payload": {"ref": "refs/heads/dev"}},
    {"type": "WatchEvent", "repo": {"name": "u/other"}, "created_at": "2026-11-12T09:00:00Z"},
    {"type": "GollumEvent", "repo": {"name": "u/wiki"}, "created_at": "2026-11-11T09:00:00Z"},
]


def test_build_feed_dedupes_and_describes_pushes():
    feed = activity.build_feed(EVENTS)
    assert [(e["action"], e["repo"]) for e in feed] == [
        ("pushed to", "u/flowbench"), ("pushed to", "u/doppel"), ("starred", "u/other")]
    assert feed[0]["detail"] == "2 commit(s) to main"
    assert feed[1]["detail"] == "to dev"


def test_build_feed_sorts_out_of_order_events_newest_first():
    shuffled = [EVENTS[3], EVENTS[0], EVENTS[2], EVENTS[1]]
    feed = activity.build_feed(shuffled)
    times = [e["created_at"] for e in feed]
    assert times == sorted(times, reverse=True)
    assert feed[0]["detail"] == "2 commit(s) to main", "dedupe keeps the newest push"


def test_build_wrapped_streak_and_counts():
    wrapped = activity.build_wrapped(EVENTS, today=date(2026, 11, 15))
    assert wrapped["total_events"] == 5
    assert wrapped["active_days"] == 4
    assert wrapped["current_streak"] == 2
    assert wrapped["top_repos"][0] == {"repo": "flowbench", "events": 2}
    # A quiet today still counts a streak ending yesterday.
    assert activity.build_wrapped(EVENTS, today=date(2026, 11, 16))["current_streak"] == 2
    assert activity.build_wrapped(EVENTS, today=date(2026, 11, 20))["current_streak"] == 0


def test_github_events_are_fetched_once_for_feed_and_wrapped():
    loader = AsyncMock(return_value=EVENTS)
    with patch.object(activity, "_load_github_events", loader):
        asyncio.run(activity.github_feed())
        asyncio.run(activity.github_wrapped())
    assert loader.await_count == 1


def test_failed_fetch_serves_last_good_value_and_backs_off():
    async def scenario():
        good = AsyncMock(return_value=EVENTS)
        with patch.object(activity, "_load_github_events", good):
            assert await activity._github_events() == EVENTS
        # Expire the cache, then fail: the last good value keeps being served.
        # Relative to "now": the monotonic clock starts near 0 on fresh CI runners.
        expired = time.monotonic() - activity.SOCIAL_CACHE_SECONDS - 1
        activity._cache["github_events"] = (expired, EVENTS)
        failing = AsyncMock(side_effect=RuntimeError("rate limited"))
        with patch.object(activity, "_load_github_events", failing):
            assert await activity._github_events() == EVENTS
            assert await activity._github_events() == EVENTS
        assert failing.await_count == 1, "failure is cached instead of retried every request"
    asyncio.run(scenario())


def test_failure_without_history_returns_none():
    with patch.object(activity, "_load_github_events", AsyncMock(side_effect=RuntimeError)):
        assert asyncio.run(activity.github_feed()) is None


def test_concurrent_cold_requests_share_one_upstream_call():
    async def slow():
        await asyncio.sleep(0.01)
        return EVENTS

    async def scenario():
        loader = AsyncMock(side_effect=slow)
        with patch.object(activity, "_load_github_events", loader):
            await asyncio.gather(*(activity._github_events() for _ in range(5)))
        return loader.await_count
    assert asyncio.run(scenario()) == 1


@pytest.mark.parametrize("path,fn", [("github_feed", "github_feed"),
                                     ("github_wrapped", "github_wrapped"),
                                     ("repo_health", "repo_health")])
def test_activity_endpoints_503_on_failure(client, api_base, path, fn):
    with patch(f"routers.coding_activity.{fn}", new=AsyncMock(return_value=None)):
        assert client.get(f"{api_base}/{path}").status_code == 503


def test_showcased_repos_parses_project_links():
    repos = activity.showcased_repos()
    assert repos and all(r.count("/") == 1 for r in repos)
    assert len(repos) == len(set(repos))


def test_github_token_is_sent_when_configured(monkeypatch):
    monkeypatch.setattr(activity, "GITHUB_TOKEN", "ghp_test")
    assert activity._github_headers()["Authorization"] == "Bearer ghp_test"
    monkeypatch.setattr(activity, "GITHUB_TOKEN", None)
    assert "Authorization" not in activity._github_headers()


# ---------- analytics extras ----------

def test_api_try_event_is_accepted(client, api_base):
    import routers.analytics as analytics_router
    analytics_router.rate_limiter.clear()
    res = client.post(f"{api_base}/analytics/track",
                      json={"event": "api_try", "metadata": {"endpoint": "/skills"}})
    assert res.status_code == 201


def test_trends_unavailable_when_sink_disabled(client, api_base):
    assert client.get(f"{api_base}/analytics/trends").status_code == 503


def test_trends_rejects_unsupported_windows(client, api_base):
    import routers.analytics as analytics_router
    with patch.object(analytics_router.analytics_sink, "enabled", True):
        assert client.get(f"{api_base}/analytics/trends?days=90").status_code == 422


def test_public_trends_cache_is_per_window():
    sink = BigQueryAnalyticsSink.__new__(BigQueryAnalyticsSink)
    calls = []

    def fake_summary(days):
        calls.append(days)
        return {"daily": {}, "totals": {"page_view": days}, "total_events": days}

    sink.summary = fake_summary
    assert sink.public_trends(7)["total_events"] == 7
    assert sink.public_trends(14)["total_events"] == 14
    assert sink.public_trends(7)["total_events"] == 7
    assert calls == [7, 14]


def test_public_trends_omit_private_fields():
    sink = BigQueryAnalyticsSink.__new__(BigQueryAnalyticsSink)
    sink.summary = lambda days: {"table": "secret.table", "daily": {"2026-11-15": 3},
                                 "totals": {"page_view": 3}, "total_events": 3}
    assert "table" not in sink.public_trends(14)


def test_warehouse_requires_token_then_reports_disabled_sink(client, api_base):
    assert client.get(f"{api_base}/analytics/warehouse").status_code == 401
    assert client.get(f"{api_base}/analytics/warehouse", headers=ADMIN).status_code == 503
