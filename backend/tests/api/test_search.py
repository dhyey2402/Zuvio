import pytest
import uuid
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.folder import Folder
from app.models.file import File
from app.models.user import User
from app.models.share import Share
from app.core.config import settings
from app.main import app
from app.api.deps import get_current_user
from datetime import datetime, timezone

# Use the same setup as test_files
MOCK_USER = User(id=uuid.uuid4(), email="test_search@example.com")
OTHER_USER = User(id=uuid.uuid4(), email="other_search@example.com")

@pytest.fixture(autouse=True)
def setup_users(db: Session):
    for u in [MOCK_USER, OTHER_USER]:
        user = db.query(User).filter(User.email == u.email).first()
        if not user:
            db.add(User(id=u.id, email=u.email, password_hash="test"))
    db.commit()

def override_get_current_user():
    return MOCK_USER

@pytest.fixture(autouse=True)
def override_deps():
    app.dependency_overrides[get_current_user] = override_get_current_user
    yield
    app.dependency_overrides.pop(get_current_user, None)

@pytest.fixture
def sample_data(db: Session):
    # My folder
    my_folder = Folder(owner_id=MOCK_USER.id, name="My Search Folder")
    db.add(my_folder)
    db.commit()
    db.refresh(my_folder)

    # My file
    my_file = File(
        owner_id=MOCK_USER.id, folder_id=my_folder.id, 
        original_filename="Searchable Document.pdf", storage_path=f"path1_{uuid.uuid4()}",
        mime_type="application/pdf", extension="pdf", size=100
    )
    db.add(my_file)

    # Deleted file
    deleted_file = File(
        owner_id=MOCK_USER.id, original_filename="Searchable Deleted.pdf", 
        storage_path=f"path2_{uuid.uuid4()}", mime_type="application/pdf", extension="pdf", size=100,
        deleted_at=datetime.now(timezone.utc)
    )
    db.add(deleted_file)

    # Other user's file
    other_file = File(
        owner_id=OTHER_USER.id, original_filename="Searchable Secret.pdf", 
        storage_path=f"path3_{uuid.uuid4()}", mime_type="application/pdf", extension="pdf", size=100
    )
    db.add(other_file)

    db.commit()
    yield {"my_folder": my_folder, "my_file": my_file, "other_file": other_file, "deleted_file": deleted_file}
    
    db.delete(my_file)
    db.delete(deleted_file)
    db.delete(other_file)
    db.delete(my_folder)
    db.commit()

def test_search_basic(client: TestClient, sample_data):
    response = client.get(f"{settings.API_V1_STR}/search?q=Searchable")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1 # only my_file, because deleted is excluded and other is unauthorized
    assert data["items"][0]["name"] == "Searchable Document.pdf"

def test_search_folder(client: TestClient, sample_data):
    response = client.get(f"{settings.API_V1_STR}/search?q=My Search")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["name"] == "My Search Folder"
    assert data["items"][0]["type"] == "folder"

def test_search_type_filter(client: TestClient, sample_data):
    response = client.get(f"{settings.API_V1_STR}/search?q=Search&type=folder")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["type"] == "folder"

    response = client.get(f"{settings.API_V1_STR}/search?q=Search&type=file")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["type"] == "file"
