from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.core.security import get_password_hash
from app.models.user import User
import uuid

def test_register_user(client: TestClient, db: Session):
    response = client.post(
        "/api/v1/auth/register",
        json={"email": f"test_{uuid.uuid4()}@example.com", "password": "strongpassword123", "full_name": "Test User"}
    )
    assert response.status_code == 201
    data = response.json()
    assert "email" in data
    assert "password_hash" not in data
    assert "password" not in data
    assert data["full_name"] == "Test User"

def test_register_duplicate_user(client: TestClient, db: Session):
    email = f"duplicate_{uuid.uuid4()}@example.com"
    client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "strongpassword123"}
    )
    response = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "strongpassword123"}
    )
    assert response.status_code == 400

def test_login_user(client: TestClient, db: Session):
    email = f"login_{uuid.uuid4()}@example.com"
    client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "strongpassword123"}
    )
    response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "strongpassword123"}
    )
    assert response.status_code == 200
    assert "access_token" in response.cookies
    assert "refresh_token" in response.cookies

def test_login_invalid_password(client: TestClient, db: Session):
    email = f"login2_{uuid.uuid4()}@example.com"
    client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "strongpassword123"}
    )
    response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "wrongpassword"}
    )
    assert response.status_code == 401
    
def test_read_users_me(client: TestClient, db: Session):
    email = f"me_{uuid.uuid4()}@example.com"
    client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "strongpassword123"}
    )
    # Login sets cookies
    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "strongpassword123"}
    )
    
    response = client.get("/api/v1/auth/me", cookies=login_response.cookies)
    assert response.status_code == 200
    assert response.json()["email"] == email

def test_read_users_me_unauthenticated(client: TestClient):
    client.cookies.clear()
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401

def test_logout(client: TestClient, db: Session):
    email = f"logout_{uuid.uuid4()}@example.com"
    client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "strongpassword123"}
    )
    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "strongpassword123"}
    )
    
    logout_response = client.post("/api/v1/auth/logout", cookies=login_response.cookies)
    assert logout_response.status_code == 200
    # The set-cookie header should clear the cookies
    assert 'access_token=""' in logout_response.headers.get("set-cookie", "") or "Max-Age=0" in logout_response.headers.get("set-cookie", "")
