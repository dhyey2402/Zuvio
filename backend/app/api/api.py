from fastapi import APIRouter
from app.api.routes import auth, files, folders, shares, public_links, search, trash

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(files.router, prefix="/files", tags=["files"])
api_router.include_router(folders.router, prefix="/folders", tags=["folders"])
api_router.include_router(shares.router, prefix="/shares", tags=["shares"])
api_router.include_router(public_links.router, prefix="/public-links", tags=["public_links"])
api_router.include_router(search.router, prefix="/search", tags=["search"])
api_router.include_router(trash.router, prefix="/trash", tags=["trash"])
