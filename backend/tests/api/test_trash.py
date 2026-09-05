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

MOCK_USER = User(id=uuid.uuid4(), email="test_trash@example.com")

@pytest.fixture(autouse=True)
def setup_users(db: Session):
    user = db.query(User).filter(User.email == MOCK_USER.email).first()
    if not user:
        db.add(User(id=MOCK_USER.id, email=MOCK_USER.email, password_hash="test"))
        db.commit()

def override_get_current_user():
    return MOCK_USER

@pytest.fixture(autouse=True)
def override_deps():
    app.dependency_overrides[get_current_user] = override_get_current_user
    yield
    app.dependency_overrides.pop(get_current_user, None)

@pytest.fixture
def sample_trash(db: Session):
    # Deleted folder
    folder = Folder(
        owner_id=MOCK_USER.id, name="Deleted Folder",
        deleted_at=datetime.now(timezone.utc)
    )
    db.add(folder)
    db.commit()
    db.refresh(folder)

    # Deleted file inside the folder
    file = File(
        owner_id=MOCK_USER.id, folder_id=folder.id, 
        original_filename="deleted_file.txt", storage_path=f"path_{uuid.uuid4()}",
        mime_type="text/plain", extension="txt", size=10,
        deleted_at=folder.deleted_at # Same delete time
    )
    db.add(file)
    db.commit()
    file_id = file.id
    folder_id = folder.id
    yield {"folder": folder, "file": file}
    
    db.expire_all()
    file_in_db = db.query(File).filter(File.id == file_id).first()
    if file_in_db:
        db.delete(file_in_db)
    folder_in_db = db.query(Folder).filter(Folder.id == folder_id).first()
    if folder_in_db:
        db.delete(folder_in_db)
    db.commit()

def test_get_trash(client: TestClient, sample_trash):
    response = client.get(f"{settings.API_V1_STR}/trash")
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) >= 2
    names = [item["name"] for item in data["items"]]
    assert "Deleted Folder" in names
    assert "deleted_file.txt" in names

def test_restore_item(client: TestClient, db: Session, sample_trash):
    folder_id = sample_trash["folder"].id
    
    # Restore the folder
    response = client.post(f"{settings.API_V1_STR}/trash/{folder_id}/restore")
    assert response.status_code == 200
    assert response.json()["type"] == "folder"
    
    # Check if folder is restored
    db.expire_all()
    folder = db.query(Folder).filter(Folder.id == folder_id).first()
    assert folder.deleted_at is None
    
    # Check if child file is recursively restored
    file = db.query(File).filter(File.id == sample_trash["file"].id).first()
    assert file.deleted_at is None

@patch("app.api.routes.trash.storage_service")
def test_permanent_delete(mock_storage, client: TestClient, db: Session, sample_trash):
    file_id = sample_trash["file"].id
    
    # Permanent delete file
    response = client.delete(f"{settings.API_V1_STR}/trash/{file_id}")
    assert response.status_code == 204
    
    # Verify DB record is gone
    file = db.query(File).filter(File.id == file_id).first()
    assert file is None
    
    # Verify storage service was called
    mock_storage.delete_object.assert_called_once()
