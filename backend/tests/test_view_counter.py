from concurrent.futures import ThreadPoolExecutor
from unittest.mock import MagicMock
import pytest
from utility.view_counter import MemoryViewCounter, FirestoreViewCounter
import routers.analytics as analytics_router

VIEW = "44afd753-43e4-4dd6-b1ec-6639c36d15cb"
SESSION = "51cbd573-a477-4147-ac38-96e01f877080"


@pytest.fixture
def counter(monkeypatch):
    store = MemoryViewCounter()
    monkeypatch.setattr(analytics_router, "view_counter", store)
    analytics_router.view_rate_limiter.clear()
    analytics_router.dashboard_rate_limiter.clear()
    analytics_router.rate_limiter.clear()
    return store


def test_view_retry_is_idempotent_and_session_is_not_a_unique_person():
    counter = MemoryViewCounter()
    counter.heartbeat(VIEW, SESSION, now=100)
    counter.heartbeat(VIEW, SESSION, now=120)
    assert counter.stats(now=120) == {"total_views": 1, "viewing_now": 1}
    counter.heartbeat("second-page-load", SESSION, now=130)
    assert counter.stats(now=130) == {"total_views": 2, "viewing_now": 1}


def test_presence_expires_without_losing_total():
    counter = MemoryViewCounter()
    counter.heartbeat(VIEW, SESSION, now=100)
    assert counter.stats(now=191) == {"total_views": 1, "viewing_now": 0}
    counter.heartbeat(VIEW, SESSION, now=192)
    assert counter.stats(now=192) == {"total_views": 1, "viewing_now": 1}


def test_public_counts_are_aggregate_only(client, api_base, counter):
    response = client.post(f"{api_base}/analytics/views", json={"view_id": VIEW, "session_id": SESSION})
    assert response.status_code == 200
    assert response.json() == {"total_views": 1, "viewing_now": 1}
    response = client.get(f"{api_base}/analytics/views")
    assert response.json() == {"total_views": 1, "viewing_now": 1}
    assert response.headers["cache-control"] == "no-store"
    assert client.get(f"{api_base}/analytics/summary").status_code in (401, 503)


def test_presence_rejects_invalid_ids_and_extra_data(client, api_base, counter):
    response = client.post(f"{api_base}/analytics/views", json={"view_id": "bad", "session_id": SESSION})
    assert response.status_code == 422
    response = client.post(f"{api_base}/analytics/views", json={"view_id": VIEW, "session_id": SESSION, "ip": "anything"})
    assert response.status_code == 422


def test_public_read_does_not_increment(client, api_base, counter):
    for _ in range(3):
        assert client.get(f"{api_base}/analytics/views").json()["total_views"] == 0


def test_presence_rate_limit(client, api_base, counter):
    for _ in range(analytics_router.view_rate_limiter._max_requests):
        assert client.post(f"{api_base}/analytics/views", json={"view_id": VIEW, "session_id": SESSION}).status_code == 200
    assert client.post(f"{api_base}/analytics/views", json={"view_id": VIEW, "session_id": SESSION}).status_code == 429


def test_storage_failure_is_not_a_fake_zero(client, api_base, counter, monkeypatch):
    def fail():
        raise RuntimeError("Storage unavailable")
    monkeypatch.setattr(counter, "stats", fail)
    response = client.get(f"{api_base}/analytics/views")
    assert response.status_code == 503
    assert response.headers["cache-control"] == "no-store"


def test_concurrent_retries_count_once():
    store = MemoryViewCounter()
    with ThreadPoolExecutor(max_workers=8) as pool:
        list(pool.map(lambda _: store.heartbeat(VIEW, SESSION, now=100), range(50)))
    assert store.stats(now=100) == {"total_views": 1, "viewing_now": 1}


@pytest.mark.parametrize("existing,write_count", [(False, 4), (True, 2)])
def test_firestore_transaction_only_increments_new_views(monkeypatch, existing, write_count):
    from google.cloud import firestore
    store = FirestoreViewCounter()
    store.client = MagicMock()
    view, session, total, daily = MagicMock(), MagicMock(), MagicMock(), MagicMock()
    refs = {"portfolio_views": view, "portfolio_sessions": session,
            "portfolio_stats": total, "portfolio_daily": daily}
    store.client.collection.side_effect = lambda name: MagicMock(document=MagicMock(return_value=refs[name]))
    view.get.return_value.exists = existing
    transaction = store.client.transaction.return_value
    monkeypatch.setattr(firestore, "transactional", lambda fn: fn)
    monkeypatch.setattr(store, "stats", lambda: {"total_views": 1, "viewing_now": 1})
    assert store.heartbeat(VIEW, SESSION) == {"total_views": 1, "viewing_now": 1}
    assert transaction.set.call_count == write_count
    writes = {call.args[0]: call.args[1] for call in transaction.set.call_args_list}
    assert set(writes[view]) == {"expires_at"}
    assert set(writes[session]) == {"last_seen", "expires_at"}
    assert (writes[session]["expires_at"] - writes[session]["last_seen"]).total_seconds() == 86400
    if existing:
        assert total not in writes
        assert daily not in writes
    else:
        assert isinstance(writes[total]["total_views"], firestore.Increment)
        assert isinstance(writes[daily]["views"], firestore.Increment)
        assert "expires_at" in writes[daily]


def test_memory_counter_dashboard_and_events():
    counter = MemoryViewCounter()
    counter.heartbeat(VIEW, SESSION)
    counter.heartbeat(VIEW, SESSION)
    counter.record_event("page_view")
    counter.record_event("project_click", "doppel")
    counter.record_event("project_case_study", "doppel")
    counter.record_event("bad event!")
    counter.record_event("hire_someone_else")
    counter.record_event("project_click", "bad project!")
    board = counter.dashboard()
    assert board["total_views"] == 1
    assert len(board["daily_views"]) == 14
    assert board["daily_views"][-1]["views"] == 1
    assert board["events"] == {"project_click": 2, "page_view": 1, "project_case_study": 1}
    assert board["projects"] == {"doppel": {"clicks": 1, "case_studies": 1}}


def test_dashboard_endpoint_returns_aggregates(client, api_base, counter):
    client.post(f"{api_base}/analytics/views", json={"view_id": VIEW, "session_id": SESSION})
    client.post(f"{api_base}/analytics/track",
                json={"event": "project_click", "metadata": {"project": "mahakal", "destination": "live"}})
    response = client.get(f"{api_base}/analytics/dashboard")
    assert response.status_code == 200
    body = response.json()
    assert body["total_views"] == 1
    assert body["events"]["project_click"] == 1
    assert body["projects"]["mahakal"]["clicks"] == 1
    assert len(body["daily_views"]) == 14
    assert response.headers["cache-control"] == "no-store"


def test_unknown_projects_are_not_counted(client, api_base, counter):
    client.post(f"{api_base}/analytics/track",
                json={"event": "project_click", "metadata": {"project": "not-a-real-project"}})
    body = client.get(f"{api_base}/analytics/dashboard").json()
    assert body["events"] == {"project_click": 1}
    assert body["projects"] == {}


def test_dashboard_hides_entries_stored_before_the_allowlist(client, api_base, counter):
    counter._events.update({"hire_someone_else": 9, "page_view": 2})
    counter._projects["fake-project"]["clicks"] = 4
    counter._projects["doppel"]["clicks"] = 1
    body = client.get(f"{api_base}/analytics/dashboard").json()
    assert body["events"] == {"page_view": 2}
    assert set(body["projects"]) == {"doppel"}


def test_server_side_events_reach_public_counters_but_not_from_clients(client, api_base, counter, monkeypatch):
    monkeypatch.setattr("utility.view_counter.view_counter", counter)
    assert client.get(f"{api_base}/resume/download").status_code == 200
    assert client.post(f"{api_base}/analytics/track", json={"event": "resume_download"}).status_code == 422
    assert client.get(f"{api_base}/analytics/dashboard").json()["events"] == {"resume_download": 1}


def test_dashboard_rate_limit(client, api_base, counter):
    for _ in range(analytics_router.dashboard_rate_limiter._max_requests):
        assert client.get(f"{api_base}/analytics/dashboard").status_code == 200
    response = client.get(f"{api_base}/analytics/dashboard")
    assert response.status_code == 429
    assert response.headers["retry-after"] == "60"


def test_firestore_dashboard_is_cached_and_batches_daily_reads(monkeypatch):
    from types import SimpleNamespace
    store = FirestoreViewCounter()
    store.client = MagicMock()
    monkeypatch.setattr(store, "stats", lambda: {"total_views": 5, "viewing_now": 1})
    public = store.client.collection.return_value.document.return_value.get.return_value
    public.to_dict.return_value = {"events": {"page_view": 3, "section_view": 7}, "projects": {}}
    today = __import__("datetime").datetime.now(__import__("datetime").timezone.utc).date().isoformat()
    store.client.get_all.return_value = [SimpleNamespace(id=today, exists=True, to_dict=lambda: {"views": 4}),
                                         SimpleNamespace(id="2000-01-01", exists=False, to_dict=lambda: None)]
    clock = [100]
    monkeypatch.setattr("utility.view_counter.time.monotonic", lambda: clock[0])
    board = store.dashboard()
    assert board["daily_views"][-1] == {"date": today, "views": 4}
    assert list(board["events"]) == ["section_view", "page_view"]
    board["events"].clear()
    assert store.dashboard()["events"], "cached snapshot must not be mutable by callers"
    assert store.client.get_all.call_count == 1
    assert len(store.client.get_all.call_args.args[0]) == 14
    clock[0] = 131
    store.dashboard()
    assert store.client.get_all.call_count == 2


def test_firestore_aggregate_reads_are_cached(monkeypatch):
    from types import SimpleNamespace
    store = FirestoreViewCounter()
    store.client = MagicMock()
    stats_collection, sessions_collection = MagicMock(), MagicMock()
    store.client.collection.side_effect = lambda name: {
        "portfolio_stats": stats_collection, "portfolio_sessions": sessions_collection
    }[name]
    stats_collection.document.return_value.get.return_value.to_dict.return_value = {"total_views": 42}
    aggregate = sessions_collection.where.return_value.count.return_value
    aggregate.get.return_value = [[SimpleNamespace(value=3)]]
    clock = [100]
    monkeypatch.setattr("utility.view_counter.time.monotonic", lambda: clock[0])
    assert store.stats() == {"total_views": 42, "viewing_now": 3}
    assert store.stats() == {"total_views": 42, "viewing_now": 3}
    assert aggregate.get.call_count == 1
    clock[0] = 111
    assert store.stats()["viewing_now"] == 3
    assert aggregate.get.call_count == 2
