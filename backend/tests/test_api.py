import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data
    assert "service" in data

def test_unauthorized_files_access():
    response = client.get("/api/files")
    assert response.status_code == 401
    assert "Missing or invalid authentication token" in response.json()["detail"]

def test_unauthorized_analyses_access():
    response = client.get("/api/analyses")
    assert response.status_code == 401

def test_unauthorized_reports_access():
    response = client.get("/api/reports")
    assert response.status_code == 401
