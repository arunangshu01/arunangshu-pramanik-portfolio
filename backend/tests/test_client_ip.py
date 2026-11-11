import pytest
from starlette.requests import Request
from utility.client_ip import client_ip
from utility.rate_limit import InMemoryRateLimiter


def request_with(*forwarded_for, peer="169.254.1.1"):
    headers = [(b"x-forwarded-for", value.encode()) for value in forwarded_for]
    return Request({"type": "http", "headers": headers, "client": (peer, 1234)})


def test_forwarded_for_is_ignored_when_not_behind_a_proxy():
    assert client_ip(request_with("198.51.100.1"), proxy_hops=None) == "169.254.1.1"


@pytest.mark.parametrize("hops,expected", [(0, "35.191.0.1"), (1, "203.0.113.7"), (5, "198.51.100.1")])
def test_uses_the_entry_written_by_a_trusted_proxy(hops, expected):
    assert client_ip(request_with("198.51.100.1, 203.0.113.7, 35.191.0.1"), proxy_hops=hops) == expected


def test_forged_leading_entries_do_not_change_the_client():
    first = client_ip(request_with("1.1.1.1, 203.0.113.7, 35.191.0.1"), proxy_hops=1)
    second = client_ip(request_with("2.2.2.2, 203.0.113.7, 35.191.0.1"), proxy_hops=1)
    assert first == second == "203.0.113.7"


def test_extra_header_lines_cannot_hide_the_appended_entry():
    assert client_ip(request_with("9.9.9.9", "203.0.113.7, 35.191.0.1"), proxy_hops=1) == "203.0.113.7"


def test_missing_header_falls_back_to_peer():
    assert client_ip(request_with(), proxy_hops=1) == "169.254.1.1"


def test_rate_limiter_prunes_idle_keys(monkeypatch):
    clock = [0.0]
    monkeypatch.setattr("utility.rate_limit.time.monotonic", lambda: clock[0])
    limiter = InMemoryRateLimiter(max_requests=1, window_seconds=10, max_keys=2)
    assert limiter.allow("a") and limiter.allow("b")
    assert not limiter.allow("c")
    clock[0] = 11
    assert limiter.allow("c")
    assert len(limiter._hits) == 1


def test_rate_limiter_global_cap_and_window(monkeypatch):
    clock = [0.0]
    monkeypatch.setattr("utility.rate_limit.time.monotonic", lambda: clock[0])
    limiter = InMemoryRateLimiter(max_requests=5, window_seconds=10, global_max_requests=2)
    assert limiter.allow("a") and limiter.allow("b")
    assert not limiter.allow("c")
    clock[0] = 11
    assert limiter.allow("c")
