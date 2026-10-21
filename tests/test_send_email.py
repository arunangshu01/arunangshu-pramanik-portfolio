import pytest
import routers.send_email as send_email_router
from source.send_email_contact import SendContactEmail


@pytest.fixture(autouse=True)
def mock_brevo(monkeypatch):
    async def fake_send(self):
        return None
    monkeypatch.setattr(SendContactEmail, "send_email", fake_send)


@pytest.fixture(autouse=True)
def reset_limiter():
    send_email_router.rate_limiter._hits.clear()
    yield
    send_email_router.rate_limiter._hits.clear()


def _form():
    return {"name": "Test User", "email": "test@example.com", "message": "Hello!"}


def test_send_email_success(client, api_base):
    res = client.post(f"{api_base}/send_email", data=_form())
    assert res.status_code == 201
    assert res.json()["message"] == "Your message has been sent successfully."


def test_send_email_missing_fields(client, api_base):
    res = client.post(f"{api_base}/send_email", data={"name": "Test User"})
    assert res.status_code == 422


def test_send_email_invalid_email(client, api_base):
    form = _form()
    form["email"] = "not-an-email"
    res = client.post(f"{api_base}/send_email", data=form)
    assert res.status_code == 422


def test_send_email_json_body_rejected(client, api_base):
    res = client.post(f"{api_base}/send_email", json=_form())
    assert res.status_code == 422


def test_send_email_rate_limited(client, api_base):
    limit = send_email_router.rate_limiter._max_requests
    for _ in range(limit):
        assert client.post(f"{api_base}/send_email", data=_form()).status_code == 201
    res = client.post(f"{api_base}/send_email", data=_form())
    assert res.status_code == 429
    assert res.json()["detail"]["error_type"] == "RateLimitExceeded"


def test_send_email_brevo_failure_returns_500(client, api_base, monkeypatch):
    async def failing_send(self):
        raise RuntimeError("brevo down")
    monkeypatch.setattr(SendContactEmail, "send_email", failing_send)
    res = client.post(f"{api_base}/send_email", data=_form())
    assert res.status_code == 500
    assert res.json()["detail"]["error_type"] == "RuntimeError"
