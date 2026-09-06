from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import Optional
from fastapi import HTTPException, status
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin
from app.core.security import get_password_hash, verify_password

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()

def create_user(db: Session, user_in: UserCreate) -> User:
    user = get_user_by_email(db, user_in.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this username already exists in the system.",
        )
    
    hashed_password = get_password_hash(user_in.password)
    db_user = User(
        email=user_in.email,
        password_hash=hashed_password,
        full_name=user_in.full_name,
        avatar_url=user_in.avatar_url
    )
    db.add(db_user)
    try:
        db.commit()
        db.refresh(db_user)
        return db_user
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error creating user. Possibly duplicate email.",
        )

def authenticate_user(db: Session, user_in: UserLogin) -> User:
    user = get_user_by_email(db, user_in.email)
    if not user:
        return None
    if not user.password_hash or not verify_password(user_in.password, user.password_hash):
        return None
    return user

def get_or_create_google_user(db: Session, email: str, google_id: str, name: str, picture: str) -> User:
    user = get_user_by_email(db, email)
    if user:
        if not user.google_id:
            user.google_id = google_id
            user.auth_provider = "google"
            db.commit()
            db.refresh(user)
        return user
    
    db_user = User(
        email=email,
        password_hash=None,
        google_id=google_id,
        auth_provider="google",
        full_name=name,
        avatar_url=picture
    )
    db.add(db_user)
    try:
        db.commit()
        db.refresh(db_user)
        return db_user
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error creating user via Google OAuth.",
        )
