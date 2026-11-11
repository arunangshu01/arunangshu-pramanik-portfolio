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


@pytest.mark.parametrize("path,module,setting", [
    ("personal_info", "source.personal_info_extract", "personal_info_file"),
    ("profile_summary", "source.profile_summary_extract", "profile_summary_file"),
    ("education_details", "source.education_details_extract", "education_details_file"),
    ("skills", "source.skills_extract", "skills_file"),
    ("experience", "source.experience_extract", "experience_file"),
    ("awards_recognitions", "source.awards_recognitions_extract", "awards_recognitions_file"),
])
@pytest.mark.parametrize("content", [None, "{bad json"])
def test_data_errors_do_not_leak_internals(client, api_base, tmp_path, monkeypatch, path, module, setting, content):
    data_file = tmp_path / "secret-location" / "data.json"
    if content is not None:
        data_file.parent.mkdir()
        data_file.write_text(content)
    monkeypatch.setattr(f"{module}.{setting}", str(data_file))
    res = client.get(f"{api_base}/{path}")
    assert res.status_code == 422
    assert res.json()["detail"]["error_type"] == "DataUnavailable"
    assert res.json()["detail"]["error_message"].endswith("information is currently unavailable.")
    assert "secret-location" not in res.text and "Errno" not in res.text
