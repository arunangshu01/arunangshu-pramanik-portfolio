import pytest


def test_health_check(client, api_base):
    res = client.get(f"{api_base}/health")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "OK"
    assert body["code"] == 200


def test_api_docs_schema_uses_hosting_rewrite(client, api_base):
    schema_path = f"{api_base}/openapi.json"
    res = client.get(schema_path)
    assert res.status_code == 200
    assert f"{api_base}/health" in res.json()["paths"]
    for path in ("docs", "redoc"):
        docs = client.get(f"{api_base}/{path}")
        assert docs.status_code == 200
        assert schema_path in docs.text


def test_personal_info(client, api_base):
    res = client.get(f"{api_base}/personal_info")
    assert res.status_code == 200
    body = res.json()
    assert body["name"]
    assert "@" in body["email"]
    assert "linkedin" in body["social_media_profiles"]


def test_profile_summary(client, api_base):
    res = client.get(f"{api_base}/profile_summary")
    assert res.status_code == 200
    assert res.json()["summary"]


def test_education_details(client, api_base):
    res = client.get(f"{api_base}/education_details")
    assert res.status_code == 200
    body = res.json()
    assert body["degree"]
    assert isinstance(body["dgpa"], float)


def test_skills(client, api_base):
    res = client.get(f"{api_base}/skills")
    assert res.status_code == 200
    body = res.json()
    assert isinstance(body["programming_languages"], list)
    assert isinstance(body["others"], dict)


def test_experience(client, api_base):
    res = client.get(f"{api_base}/experience")
    assert res.status_code == 200
    body = res.json()
    assert isinstance(body, list) and body
    for entry in body:
        assert entry["role"]
        assert isinstance(entry["responsibilities"], list)


def test_awards_recognitions(client, api_base):
    res = client.get(f"{api_base}/awards_recognitions")
    assert res.status_code == 200
    body = res.json()
    assert isinstance(body, list) and body
    for award in body:
        assert award["award"]
        assert isinstance(award["timeline_period"], (str, list))


@pytest.mark.parametrize("path", [
    "personal_info", "profile_summary", "education_details",
    "skills", "experience", "awards_recognitions"
])
def test_get_endpoints_accept_no_body(client, api_base, path):
    res = client.get(f"{api_base}/{path}")
    assert res.status_code == 200
