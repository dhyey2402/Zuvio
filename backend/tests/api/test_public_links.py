import pytest
import uuid
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.folder import Folder
from app.models.file import File
from app.models.user import User
from app.core.config import settings

def test_public_link_lifecycle(client: TestClient, db: Session):
    owner_email = f"owner_{uuid.uuid4()}@example.com"
    client.post("/api/v1/auth/register", json={"email": owner_email, "password": "password"})
    owner_login = client.post("/api/v1/auth/login", json={"email": owner_email, "password": "password"})
    
    # Create folder
    folder_res = client.post("/api/v1/folders", json={"name": "Public Folder"}, cookies=owner_login.cookies)
    folder_id = folder_res.json()["id"]
    
    # Create public link
    link_res = client.post(
        "/api/v1/public-links",
        json={"folder_id": folder_id, "role": "VIEWER", "password": "secretpassword"},
        cookies=owner_login.cookies
    )
    assert link_res.status_code == 200
    token = link_res.json()["token"]
    
    # Access without password
    access_res = client.post(f"/api/v1/public-links/resolve/{token}", json={})
    assert access_res.status_code == 401 # Unauthorized because password required
    
    # Access with wrong password
    access_res = client.post(f"/api/v1/public-links/resolve/{token}", json={"password": "wrong"})
    assert access_res.status_code == 401
    
    # Access with correct password
    access_res = client.post(f"/api/v1/public-links/resolve/{token}", json={"password": "secretpassword"})
    assert access_res.status_code == 200
    
    # Verify we get folder contents
    assert access_res.json()["resource"]["type"] == "folder"
    assert access_res.json()["resource"]["id"] == folder_id
    
    # Revoke link
    revoke_res = client.delete(f"/api/v1/public-links/{token}", cookies=owner_login.cookies)
    assert revoke_res.status_code == 204
    
    # Try access again
    access_res = client.post(f"/api/v1/public-links/{token}/access", json={"password": "secretpassword"})
    assert access_res.status_code == 404 # Link not found or revoked
