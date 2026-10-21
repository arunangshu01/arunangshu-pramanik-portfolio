import pytest
from fastapi.testclient import TestClient
from app.main import app
from utility.settings import API_COMMON_PREFIX


@pytest.fixture(scope="session")
def api_base():
    return API_COMMON_PREFIX


@pytest.fixture()
def client():
    return TestClient(app)
