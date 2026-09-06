from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuth
from sqlalchemy.orm import Session
from datetime import timedelta

from app.api.deps import get_db, get_current_user
from app.core.config import settings
from app.core.security import create_access_token, create_refresh_token
from app.schemas.user import UserCreate, UserLogin, UserResponse
from app.services import user_service
from app.models.user import User

router = APIRouter()

oauth = OAuth()
oauth.register(
    name='google',
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'}
)

def set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    is_secure = settings.APP_ENV != "development"
    
    # We must use samesite="none" for cross-origin (Vercel to Render) cookie transmission
    cookie_samesite = "none" if is_secure else "lax"
    
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        expires=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite=cookie_samesite,
        secure=is_secure,
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        expires=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        samesite=cookie_samesite,
        secure=is_secure,
    )

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(
    user_in: UserCreate,
    db: Session = Depends(get_db),
):
    """
    Create new user.
    """
    user_in.email = user_in.email.lower()
    user = user_service.create_user(db, user_in)
    return user

@router.post("/login")
def login(
    response: Response,
    user_in: UserLogin,
    db: Session = Depends(get_db),
):
    """
    Login user and return tokens via HttpOnly cookies.
    """
    user_in.email = user_in.email.lower()
    user = user_service.authenticate_user(db, user_in)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    elif not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user"
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.id, expires_delta=access_token_expires
    )
    refresh_token = create_refresh_token(subject=user.id)
    
    set_auth_cookies(response, access_token, refresh_token)
    
    return {"message": "Successfully logged in"}

@router.post("/logout")
def logout(response: Response):
    """
    Logout user by clearing cookies.
    """
    is_secure = settings.APP_ENV != "development"
    cookie_samesite = "none" if is_secure else "lax"
    
    response.delete_cookie("access_token", httponly=True, samesite=cookie_samesite, secure=is_secure)
    response.delete_cookie("refresh_token", httponly=True, samesite=cookie_samesite, secure=is_secure)
    return {"message": "Successfully logged out"}

@router.get("/me", response_model=UserResponse)
def read_current_user(
    current_user: User = Depends(get_current_user),
):
    """
    Get current user profile.
    """
    return current_user

@router.get("/google/login")
async def google_login(request: Request):
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="Google OAuth is not configured")
    
    redirect_uri = settings.GOOGLE_REDIRECT_URI or str(request.url_for("google_callback"))
    return await oauth.google.authorize_redirect(request, redirect_uri)

@router.get("/google/callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    try:
        token = await oauth.google.authorize_access_token(request)
        userinfo = token.get('userinfo')
        if not userinfo:
            raise ValueError("No user info in token")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Google authentication failed: {str(e)}"
        )
    
    email = userinfo.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google account must have an email address"
        )
    
    google_id = userinfo.get("sub")
    name = userinfo.get("name")
    picture = userinfo.get("picture")
    
    user = user_service.get_or_create_google_user(db, email, google_id, name, picture)
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.id, expires_delta=access_token_expires
    )
    refresh_token = create_refresh_token(subject=user.id)
    
    redirect_url = f"{settings.FRONTEND_URL}/dashboard/drive"
    response = RedirectResponse(url=redirect_url)
    set_auth_cookies(response, access_token, refresh_token)
    
    return response
