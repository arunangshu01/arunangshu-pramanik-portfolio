import json
import pytest
from pydantic import ValidationError
from model.base_models_projects import ProjectList
import source.projects_extract as projects_source


def project(**changes):
    return {"id": "demo", "name": "Demo", "description": "A project overview.",
            "technologies": ["React"], **changes}


def test_projects_endpoint_serves_mahakal(client, api_base):
    response = client.get(f"{api_base}/projects")
    assert response.status_code == 200
    data = response.json()
    assert data[0]["id"] == "mahakal"
    assert "GPT-OSS 120B" in data[0]["description"]
    assert data[0]["highlights"]
    assert data[0]["image"] == "/mahakal-preview.png"
    assert data[0]["preview_enabled"] is True


def test_project_links_can_be_absent_and_order_is_preserved(client, api_base, tmp_path, monkeypatch):
    path = tmp_path / "projects.json"
    path.write_text(json.dumps([project(id="second"), project(id="first")]))
    monkeypatch.setattr(projects_source, "projects_file", str(path))
    response = client.get(f"{api_base}/projects")
    assert response.status_code == 200
    assert [entry["id"] for entry in response.json()] == ["second", "first"]
    assert response.json()[0]["github_url"] is None
    path.write_text("[]")
    assert client.get(f"{api_base}/projects").json() == []


@pytest.mark.parametrize("changes", [
    {"live_url": "javascript:alert(1)"}, {"github_url": "file:///etc/passwd"},
    {"image": "//untrusted.test/image.png"}, {"image": "data:image/svg+xml,test"},
    {"image": "/\\untrusted.test/image.png"}, {"status": "unknown"},
    {"id": "unsafe id"}, {"technologies": []},
])
def test_project_validation(changes):
    with pytest.raises(ValidationError):
        ProjectList.model_validate([project(**changes)])


def test_duplicate_ids_are_rejected():
    with pytest.raises(ValidationError):
        ProjectList.model_validate([project(), project()])


@pytest.mark.parametrize("content", ["{bad json", '[{"name":"Missing fields"}]'])
def test_invalid_project_data_returns_safe_error(client, api_base, tmp_path, monkeypatch, content):
    path = tmp_path / "projects.json"
    path.write_text(content)
    monkeypatch.setattr(projects_source, "projects_file", str(path))
    response = client.get(f"{api_base}/projects")
    assert response.status_code == 422
    assert response.json()["detail"]["error_message"] == "Project information is currently unavailable."
    assert str(path) not in response.text
