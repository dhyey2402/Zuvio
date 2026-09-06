from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.api import api_router
import logging
from fastapi import Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.api.deps import get_db

# Configure Production Logging
logging.basicConfig(
    level=logging.INFO if settings.APP_ENV == "production" else logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.APP_NAME,
    description="The secure backend API for the Zuvio file storage platform.",
    version="1.0.0",
)

# Configure CORS
# We want to allow credentials because we use HttpOnly cookies for Auth
origins = [str(origin) for origin in settings.BACKEND_CORS_ORIGINS]

# Ensure frontend URL and production URL are always allowed
for required_origin in [settings.FRONTEND_URL, "https://frontend-puce-zeta-22.vercel.app"]:
    if required_origin and required_origin not in origins:
        origins.append(required_origin)

from starlette.middleware.sessions import SessionMiddleware

app.add_middleware(
    SessionMiddleware, 
    secret_key=settings.SECRET_KEY, 
    max_age=3600,
    same_site="none" if settings.APP_ENV != "development" else "lax",
    https_only=settings.APP_ENV != "development"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"] if settings.APP_ENV == "production" else ["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    return {"message": f"Welcome to the {settings.APP_NAME} API."}

@app.get("/health", tags=["system"])
def health_check(db: Session = Depends(get_db)):
    """Lightweight health check endpoint for deployment probes."""
    try:
        # Check DB connectivity
        db.execute(text("SELECT 1"))
        return {"status": "ok", "environment": settings.APP_ENV}
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        from fastapi import HTTPException
        raise HTTPException(status_code=503, detail="Service unavailable")
