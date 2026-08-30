from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid

from app.api import deps
from app.models.user import User
from app.models.share import Share
from app.schemas.share import ShareCreate, ShareUpdate, ShareResponse
from app.services.permissions import require_permission

router = APIRouter()

@router.post("", response_model=ShareResponse)
def create_share(
    share_in: ShareCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    # Require OWNER to share
    require_permission(db, current_user, "OWNER", file_id=share_in.file_id, folder_id=share_in.folder_id)
    
    # Resolve recipient email to user
    recipient = db.query(User).filter(User.email == share_in.recipient_email).first()
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient user not found")
        
    if recipient.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot share with yourself")
        
    # Prevent duplicate share
    existing_share = db.query(Share).filter(
        Share.recipient_id == recipient.id,
        Share.file_id == share_in.file_id,
        Share.folder_id == share_in.folder_id
    ).first()
    if existing_share:
        raise HTTPException(status_code=400, detail="Resource already shared with this user")
        
    share = Share(
        created_by_id=current_user.id,
        recipient_id=recipient.id,
        file_id=share_in.file_id,
        folder_id=share_in.folder_id,
        role=share_in.role
    )
    db.add(share)
    db.commit()
    db.refresh(share)
    
    return share

@router.get("/{resource_id}", response_model=List[ShareResponse])
def list_shares(
    resource_id: uuid.UUID,
    resource_type: str = "file",
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    # Requires OWNER to list shares
    if resource_type == "file":
        require_permission(db, current_user, "OWNER", file_id=resource_id)
        shares = db.query(Share).filter(Share.file_id == resource_id).all()
    elif resource_type == "folder":
        require_permission(db, current_user, "OWNER", folder_id=resource_id)
        shares = db.query(Share).filter(Share.folder_id == resource_id).all()
    else:
        raise HTTPException(status_code=400, detail="Invalid resource_type")
        
    return shares

@router.patch("/{share_id}", response_model=ShareResponse)
def update_share(
    share_id: uuid.UUID,
    share_in: ShareUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    share = db.query(Share).filter(Share.id == share_id).first()
    if not share:
        raise HTTPException(status_code=404, detail="Share not found")
        
    require_permission(db, current_user, "OWNER", file_id=share.file_id, folder_id=share.folder_id)
    
    share.role = share_in.role
    db.commit()
    db.refresh(share)
    return share

@router.delete("/{share_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_share(
    share_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    share = db.query(Share).filter(Share.id == share_id).first()
    if not share:
        raise HTTPException(status_code=404, detail="Share not found")
        
    # Either OWNER of the resource, or the recipient themselves can revoke the share
    if share.recipient_id != current_user.id:
        require_permission(db, current_user, "OWNER", file_id=share.file_id, folder_id=share.folder_id)
        
    db.delete(share)
    db.commit()
    return None
