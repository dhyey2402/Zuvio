from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid
import secrets
from datetime import datetime, timedelta, timezone

from app.api import deps
from app.models.user import User
from app.models.public_link import PublicLink
from app.models.file import File
from app.models.folder import Folder
from app.schemas.public_link import PublicLinkCreate, PublicLinkResponse, PublicLinkAccess
from app.services.permissions import require_permission
from app.core.security import get_password_hash, verify_password

router = APIRouter()

@router.post("", response_model=PublicLinkResponse)
def create_public_link(
    link_in: PublicLinkCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    # Require OWNER to create a public link
    require_permission(db, current_user, "OWNER", file_id=link_in.file_id, folder_id=link_in.folder_id)
    
    token = secrets.token_urlsafe(32)
    
    expires_at = None
    if link_in.expires_in_days:
        expires_at = datetime.now(timezone.utc) + timedelta(days=link_in.expires_in_days)
        
    password_hash = None
    if link_in.password:
        password_hash = get_password_hash(link_in.password)
        
    link = PublicLink(
        token=token,
        created_by_id=current_user.id,
        file_id=link_in.file_id,
        folder_id=link_in.folder_id,
        role=link_in.role,
        password_hash=password_hash,
        expires_at=expires_at
    )
    db.add(link)
    db.commit()
    db.refresh(link)
    
    return link

@router.delete("/{token}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_public_link(
    token: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    link = db.query(PublicLink).filter(PublicLink.token == token).first()
    if not link:
        raise HTTPException(status_code=404, detail="Public link not found")
        
    # Require OWNER to revoke
    require_permission(db, current_user, "OWNER", file_id=link.file_id, folder_id=link.folder_id)
    
    link.revoked_at = datetime.now(timezone.utc)
    db.commit()
    return None

# Public access endpoint
@router.post("/resolve/{token}")
def access_public_link(
    token: str,
    access_data: PublicLinkAccess,
    db: Session = Depends(deps.get_db)
):
    link = db.query(PublicLink).filter(PublicLink.token == token).first()
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
        
    if link.revoked_at:
        raise HTTPException(status_code=403, detail="Link has been revoked")
        
    if link.expires_at and link.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=403, detail="Link has expired")
        
    if link.password_hash:
        if not access_data.password:
            raise HTTPException(status_code=401, detail="Password required")
        if not verify_password(access_data.password, link.password_hash):
            # Use a generic error message for security
            raise HTTPException(status_code=401, detail="Invalid password")
            
    # Resolve the resource details (redacted for public viewing)
    resource = None
    if link.file_id:
        file = db.query(File).filter(File.id == link.file_id).first()
        if not file or file.deleted_at:
            raise HTTPException(status_code=404, detail="File not found")
        resource = {
            "type": "file",
            "id": file.id,
            "name": file.original_filename,
            "size": file.size,
            "mime_type": file.mime_type
        }
    elif link.folder_id:
        folder = db.query(Folder).filter(Folder.id == link.folder_id).first()
        if not folder or folder.deleted_at:
            raise HTTPException(status_code=404, detail="Folder not found")
        resource = {
            "type": "folder",
            "id": folder.id,
            "name": folder.name
        }
        
    return {
        "resource": resource,
        "role": link.role,
        "token": link.token
    }
