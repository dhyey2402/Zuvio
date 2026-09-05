import pytest
import uuid
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.folder import Folder
from app.models.file import File
from app.models.user import User
from app.core.config import settings

def test_share_folder(client: TestClient, db: Session):
    # Setup users
    owner_email = f"owner_{uuid.uuid4()}@example.com"
    recipient_email = f"recipient_{uuid.uuid4()}@example.com"
    
    client.post("/api/v1/auth/register", json={"email": owner_email, "password": "password"})
    client.post("/api/v1/auth/register", json={"email": recipient_email, "password": "password"})
    
    owner_login = client.post("/api/v1/auth/login", json={"email": owner_email, "password": "password"})
    recipient_login = client.post("/api/v1/auth/login", json={"email": recipient_email, "password": "password"})
    
    # Create folder as owner
    folder_res = client.post("/api/v1/folders", json={"name": "Shared Folder"}, cookies=owner_login.cookies)
    folder_id = folder_res.json()["id"]
    
    # Share folder as owner
    share_res = client.post(
        "/api/v1/shares",
        json={"folder_id": folder_id, "recipient_email": recipient_email, "role": "VIEWER"},
        cookies=owner_login.cookies
    )
    assert share_res.status_code == 200
    
    # Access as recipient
    get_res = client.get(f"/api/v1/folders/{folder_id}", cookies=recipient_login.cookies)
    assert get_res.status_code == 200
    
    # Try to rename as VIEWER
    rename_res = client.patch(f"/api/v1/folders/{folder_id}", json={"name": "New Name"}, cookies=recipient_login.cookies)
    assert rename_res.status_code == 403
    
    # Upgrade to EDITOR
    share_id = share_res.json()["id"]
    client.patch(f"/api/v1/shares/{share_id}", json={"role": "EDITOR"}, cookies=owner_login.cookies)
    
    # Try to rename as EDITOR
    rename_res = client.patch(f"/api/v1/folders/{folder_id}", json={"name": "New Name"}, cookies=recipient_login.cookies)
    assert rename_res.status_code == 200

def test_idor_share_delete(client: TestClient, db: Session):
    owner_email = f"owner_{uuid.uuid4()}@example.com"
    recipient_email = f"recipient_{uuid.uuid4()}@example.com"
    
    client.post("/api/v1/auth/register", json={"email": owner_email, "password": "password"})
    client.post("/api/v1/auth/register", json={"email": recipient_email, "password": "password"})
    
    owner_login = client.post("/api/v1/auth/login", json={"email": owner_email, "password": "password"})
    recipient_login = client.post("/api/v1/auth/login", json={"email": recipient_email, "password": "password"})
    
    # Create and share folder
    folder_res = client.post("/api/v1/folders", json={"name": "Shared Folder"}, cookies=owner_login.cookies)
    share_res = client.post(
        "/api/v1/shares",
        json={"folder_id": folder_res.json()["id"], "recipient_email": recipient_email, "role": "EDITOR"},
        cookies=owner_login.cookies
    )
    share_id = share_res.json()["id"]
    
    # Try to delete share as unrelated user
    unrelated_email = f"unrelated_{uuid.uuid4()}@example.com"
    client.post("/api/v1/auth/register", json={"email": unrelated_email, "password": "password"})
    unrelated_login = client.post("/api/v1/auth/login", json={"email": unrelated_email, "password": "password"})
    del_res = client.delete(f"/api/v1/shares/{share_id}", cookies=unrelated_login.cookies)
    assert del_res.status_code == 403
    
    # Recipient can delete their own share
    self_del_res = client.delete(f"/api/v1/shares/{share_id}", cookies=recipient_login.cookies)
    assert self_del_res.status_code == 204
