import pytest
import uuid
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.file import File
from app.models.user import User
from app.core.config import settings
from unittest.mock import patch, MagicMock
from app.main import app
from app.api.deps import get_current_user

# Mock User
MOCK_USER = User(id=uuid.uuid4(), email="test_files@example.com")

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
def mock_storage_service():
    with patch("app.api.routes.files.storage_service") as mock_service:
        mock_service.generate_storage_path.side_effect = lambda user_id, filename: f"users/{user_id}/files/{uuid.uuid4()}/{filename}"
        mock_service.generate_presigned_post.return_value = {
            "url": "http://mock-s3.local",
            "fields": {"key": "test"}
        }
        mock_service.check_object_exists.return_value = True
        mock_service.generate_presigned_get.return_value = "http://mock-s3.local/download"
        yield mock_service


def test_init_upload_success(client: TestClient, mock_storage_service):
    response = client.post(
        f"{settings.API_V1_STR}/files/init-upload",
        json={
            "filename": "test_image.png",
            "mime_type": "image/png",
            "size": 1024 * 1024 # 1 MB
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "file_id" in data
    assert "presigned_url" in data
    assert data["presigned_url"] == "http://mock-s3.local"

def test_init_upload_invalid_mime(client: TestClient, mock_storage_service):
    response = client.post(
        f"{settings.API_V1_STR}/files/init-upload",
        json={
            "filename": "malicious.exe",
            "mime_type": "application/x-msdownload",
            "size": 1024
        }
    )
    assert response.status_code == 400
    assert "not allowed" in response.json()["detail"]

def test_init_upload_too_large(client: TestClient, mock_storage_service):
    response = client.post(
        f"{settings.API_V1_STR}/files/init-upload",
        json={
            "filename": "huge_video.mp4",
            "mime_type": "video/mp4",
            "size": settings.MAX_UPLOAD_SIZE_BYTES + 1
        }
    )
    assert response.status_code == 400
    assert "exceeds the maximum allowed limit" in response.json()["detail"]

def test_complete_upload_success(client: TestClient, db: Session, mock_storage_service):
    # First init upload
    init_response = client.post(
        f"{settings.API_V1_STR}/files/init-upload",
        json={
            "filename": "test.txt",
            "mime_type": "text/plain",
            "size": 100
        }
    )
    file_id = init_response.json()["file_id"]

    # Then complete upload
    response = client.post(
        f"{settings.API_V1_STR}/files/complete-upload",
        json={"file_id": file_id}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == file_id
    assert data["original_filename"] == "test.txt"
    mock_storage_service.check_object_exists.assert_called_once()

def test_get_file_success(client: TestClient, db: Session, mock_storage_service):
    init_response = client.post(
        f"{settings.API_V1_STR}/files/init-upload",
        json={
            "filename": "get_test.txt",
            "mime_type": "text/plain",
            "size": 100
        }
    )
    file_id = init_response.json()["file_id"]

    # Complete it
    client.post(
        f"{settings.API_V1_STR}/files/complete-upload",
        json={"file_id": file_id}
    )

    # Get it
    response = client.get(
        f"{settings.API_V1_STR}/files/{file_id}"
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == file_id
    assert "download_url" in data
    assert data["download_url"] == "http://mock-s3.local/download"

def test_delete_file_success(client: TestClient, db: Session, mock_storage_service):
    init_response = client.post(
        f"{settings.API_V1_STR}/files/init-upload",
        json={
            "filename": "del_test.txt",
            "mime_type": "text/plain",
            "size": 100
        }
    )
    file_id = init_response.json()["file_id"]

    # Delete it
    response = client.delete(
        f"{settings.API_V1_STR}/files/{file_id}"
    )
    assert response.status_code == 204

    # Verify it's deleted (soft delete)
    get_response = client.get(
        f"{settings.API_V1_STR}/files/{file_id}"
    )
    assert get_response.status_code == 404

def test_update_file(client: TestClient, db: Session, mock_storage_service):
    # init
    init_response = client.post(
        f"{settings.API_V1_STR}/files/init-upload",
        json={"filename": "rename_test.txt", "mime_type": "text/plain", "size": 100}
    )
    file_id = init_response.json()["file_id"]

    # create a folder to move into
    from app.models.folder import Folder
    folder = Folder(owner_id=MOCK_USER.id, name="Test Folder")
    db.add(folder)
    db.commit()
    db.refresh(folder)

    # rename and move
    patch_res = client.patch(
        f"{settings.API_V1_STR}/files/{file_id}",
        json={"original_filename": "renamed.txt", "folder_id": str(folder.id)}
    )
    assert patch_res.status_code == 200
    data = patch_res.json()
    assert data["original_filename"] == "renamed.txt"
    assert data["folder_id"] == str(folder.id)
