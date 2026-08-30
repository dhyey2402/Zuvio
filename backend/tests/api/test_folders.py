import pytest
import uuid
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.folder import Folder
from app.models.file import File
from app.models.user import User
from app.core.config import settings
from unittest.mock import patch
from app.main import app
from app.api.deps import get_current_user
from datetime import datetime, timezone

# Mock User
MOCK_USER = User(id=uuid.uuid4(), email="test_folders@example.com")
OTHER_USER = User(id=uuid.uuid4(), email="other_folders@example.com")

@pytest.fixture(autouse=True)
def setup_users(db: Session):
    for u in [MOCK_USER, OTHER_USER]:
        user = db.query(User).filter(User.email == u.email).first()
        if not user:
            db.add(User(id=u.id, email=u.email, password_hash="test"))
    db.commit()

@pytest.fixture(autouse=True)
def override_deps():
    def override_get_current_user():
        return MOCK_USER
    app.dependency_overrides[get_current_user] = override_get_current_user
    yield
    app.dependency_overrides.pop(get_current_user, None)

def test_create_root_folder(client: TestClient, db: Session):
    response = client.post(
        f"{settings.API_V1_STR}/folders",
        json={"name": "Projects"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Projects"
    assert data["parent_id"] is None
    
    # Check db
    folder = db.query(Folder).filter(Folder.id == uuid.UUID(data["id"])).first()
    assert folder.name == "Projects"

def test_create_nested_folder(client: TestClient, db: Session):
    # Root folder
    root_res = client.post(f"{settings.API_V1_STR}/folders", json={"name": "Work"})
    root_id = root_res.json()["id"]

    # Nested folder
    child_res = client.post(
        f"{settings.API_V1_STR}/folders",
        json={"name": "Q3 Reports", "parent_id": root_id}
    )
    assert child_res.status_code == 201
    assert child_res.json()["parent_id"] == root_id

def test_create_duplicate_folder_rejected(client: TestClient, db: Session):
    client.post(f"{settings.API_V1_STR}/folders", json={"name": "Docs"})
    res = client.post(f"{settings.API_V1_STR}/folders", json={"name": "Docs"})
    assert res.status_code == 400
    assert "already exists" in res.json()["detail"]

def test_get_folder(client: TestClient, db: Session):
    res = client.post(f"{settings.API_V1_STR}/folders", json={"name": "To Get"})
    folder_id = res.json()["id"]

    get_res = client.get(f"{settings.API_V1_STR}/folders/{folder_id}")
    assert get_res.status_code == 200
    assert get_res.json()["name"] == "To Get"

def test_rename_folder(client: TestClient, db: Session):
    res = client.post(f"{settings.API_V1_STR}/folders", json={"name": "Old Name"})
    folder_id = res.json()["id"]

    patch_res = client.patch(f"{settings.API_V1_STR}/folders/{folder_id}", json={"name": "New Name"})
    assert patch_res.status_code == 200
    assert patch_res.json()["name"] == "New Name"

def test_move_folder_prevent_circular(client: TestClient, db: Session):
    # A -> B -> C
    a_res = client.post(f"{settings.API_V1_STR}/folders", json={"name": "A"})
    a_id = a_res.json()["id"]
    
    b_res = client.post(f"{settings.API_V1_STR}/folders", json={"name": "B", "parent_id": a_id})
    b_id = b_res.json()["id"]
    
    c_res = client.post(f"{settings.API_V1_STR}/folders", json={"name": "C", "parent_id": b_id})
    c_id = c_res.json()["id"]

    # Try moving A into C (which would create C -> A -> B -> C)
    patch_res = client.patch(f"{settings.API_V1_STR}/folders/{a_id}", json={"parent_id": c_id})
    assert patch_res.status_code == 400
    assert "descendant" in patch_res.json()["detail"]

def test_soft_delete_folder_recursive(client: TestClient, db: Session):
    # A -> B
    a_res = client.post(f"{settings.API_V1_STR}/folders", json={"name": "Delete A"})
    a_id = a_res.json()["id"]
    
    b_res = client.post(f"{settings.API_V1_STR}/folders", json={"name": "Delete B", "parent_id": a_id})
    b_id = b_res.json()["id"]
    
    # Add a file in B
    file = File(owner_id=MOCK_USER.id, folder_id=uuid.UUID(b_id), original_filename="test.txt", storage_path=f"test_{uuid.uuid4()}", mime_type="text/plain", extension="txt", size=10)
    db.add(file)
    db.commit()
    db.refresh(file)
    
    del_res = client.delete(f"{settings.API_V1_STR}/folders/{a_id}")
    assert del_res.status_code == 204

    # Verify A deleted
    db.expire_all() # Ensure fresh from DB
    a = db.query(Folder).filter(Folder.id == uuid.UUID(a_id)).first()
    assert a.deleted_at is not None
    
    # Verify B deleted
    b = db.query(Folder).filter(Folder.id == uuid.UUID(b_id)).first()
    assert b.deleted_at is not None
    
    # Verify File deleted
    f = db.query(File).filter(File.id == file.id).first()
    assert f.deleted_at is not None

def test_folder_contents(client: TestClient, db: Session):
    a_res = client.post(f"{settings.API_V1_STR}/folders", json={"name": "Content Folder"})
    a_id = a_res.json()["id"]
    
    # Add subfolder
    client.post(f"{settings.API_V1_STR}/folders", json={"name": "Sub", "parent_id": a_id})
    
    # Add file
    file = File(owner_id=MOCK_USER.id, folder_id=uuid.UUID(a_id), original_filename="f1.txt", storage_path=f"path_{uuid.uuid4()}", mime_type="text/plain", extension="txt", size=10)
    db.add(file)
    db.commit()
    
    # Get contents
    res = client.get(f"{settings.API_V1_STR}/folders/{a_id}/contents")
    assert res.status_code == 200
    data = res.json()
    
    assert len(data["folders"]) == 1
    assert data["folders"][0]["name"] == "Sub"
    
    assert len(data["files"]) == 1
    assert data["files"][0]["original_filename"] == "f1.txt"

def test_breadcrumbs(client: TestClient, db: Session):
    a_res = client.post(f"{settings.API_V1_STR}/folders", json={"name": "Bread A"})
    a_id = a_res.json()["id"]
    
    b_res = client.post(f"{settings.API_V1_STR}/folders", json={"name": "Bread B", "parent_id": a_id})
    b_id = b_res.json()["id"]
    
    res = client.get(f"{settings.API_V1_STR}/folders/{b_id}/breadcrumbs")
    assert res.status_code == 200
    data = res.json()
    
    assert len(data) == 3
    assert data[0]["name"] == "My Drive"
    assert data[0]["id"] is None
    assert data[1]["name"] == "Bread A"
    assert data[1]["id"] == a_id
    assert data[2]["name"] == "Bread B"
    assert data[2]["id"] == b_id
