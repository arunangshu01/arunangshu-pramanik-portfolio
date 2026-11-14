from unittest.mock import AsyncMock, MagicMock, patch


def test_share_page_has_og_tags_and_redirect(client, api_base):
    response = client.get(f"{api_base}/share/doppel")
    assert response.status_code == 200
    body = response.text
    assert 'property="og:title"' in body and "doppel" in body
    assert 'property="og:image"' in body and "/doppel-preview.png" in body
    assert "window.location.replace" in body and "#projects" in body


def test_share_unknown_project_is_404(client, api_base):
    response = client.get(f"{api_base}/share/not-a-project")
    assert response.status_code == 404


def test_print_resume_renders_html(client, api_base):
    response = client.get(f"{api_base}/resume/print")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]
    assert "Arunangshu Pramanik" in response.text
    assert "Experience" in response.text and "Skills" in response.text


def test_ask_status_reports_configuration(client, api_base):
    response = client.get(f"{api_base}/ask/status")
    assert response.status_code == 200
    assert set(response.json()) == {"enabled"}


def test_ask_returns_503_when_not_configured(client, api_base):
    with patch("routers.ask.assistant_configured", return_value=False):
        status_response = client.get(f"{api_base}/ask/status")
        assert status_response.json() == {"enabled": False}
        response = client.post(f"{api_base}/ask", json={"question": "What does he do?"})
    assert response.status_code == 503


def test_github_activity_success(client, api_base):
    payload = {"username": "arunangshu01", "public_repos": 10, "followers": 5,
               "recent_events": 8, "recent_pushes": 3, "latest_activity": "2026-11-01",
               "profile_url": "https://github.com/arunangshu01"}
    with patch("routers.coding_activity.github_activity", new=AsyncMock(return_value=payload)):
        response = client.get(f"{api_base}/github_activity")
    assert response.status_code == 200 and response.json()["public_repos"] == 10


def test_github_activity_failure_is_503(client, api_base):
    with patch("routers.coding_activity.github_activity", new=AsyncMock(return_value=None)):
        response = client.get(f"{api_base}/github_activity")
    assert response.status_code == 503


def test_leetcode_stats_success(client, api_base):
    payload = {"username": "arunangshu01", "solved": 120, "easy": 40,
               "medium": 60, "hard": 20, "ranking": 123456,
               "profile_url": "https://leetcode.com/u/arunangshu01/"}
    with patch("routers.coding_activity.leetcode_stats", new=AsyncMock(return_value=payload)):
        response = client.get(f"{api_base}/leetcode_stats")
    assert response.status_code == 200 and response.json()["solved"] == 120


def test_leetcode_stats_failure_is_503(client, api_base):
    with patch("routers.coding_activity.leetcode_stats", new=AsyncMock(return_value=None)):
        response = client.get(f"{api_base}/leetcode_stats")
    assert response.status_code == 503


def test_new_client_events_are_accepted(client, api_base):
    for event in ("github_click", "linkedin_click", "leetcode_click",
                  "email_click", "share_click", "ask_open"):
        response = client.post(f"{api_base}/analytics/track", json={"event": event})
        assert response.status_code == 201, event


def test_current_project_flag_is_served(client, api_base):
    response = client.get(f"{api_base}/projects")
    assert response.status_code == 200
    flagged = [p for p in response.json() if p.get("current")]
    assert [p["id"] for p in flagged] == ["flowbench"]
