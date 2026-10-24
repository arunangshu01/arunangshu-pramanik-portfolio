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
    analytics_router.view_rate_limiter._hits.clear()
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


@pytest.mark.parametrize("existing,write_count", [(False, 3), (True, 2)])
def test_firestore_transaction_only_increments_new_views(monkeypatch, existing, write_count):
    from google.cloud import firestore
    store = FirestoreViewCounter()
    store.client = MagicMock()
    view, session, total = MagicMock(), MagicMock(), MagicMock()
    refs = {"portfolio_views": view, "portfolio_sessions": session, "portfolio_stats": total}
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
    else:
        assert isinstance(writes[total]["total_views"], firestore.Increment)


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
