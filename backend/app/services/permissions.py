import uuid
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.user import User
from app.models.file import File
from app.models.folder import Folder
from app.models.share import Share

ROLE_WEIGHTS = {
    "VIEWER": 1,
    "EDITOR": 2,
    "OWNER": 3
}

def check_permission(
    db: Session,
    user: User,
    required_role: str,
    file_id: Optional[uuid.UUID] = None,
    folder_id: Optional[uuid.UUID] = None
) -> bool:
    """
    Checks if a user has the required permission role on a file or folder.
    Returns True if permission granted, False otherwise.
    """
    if not file_id and not folder_id:
        return False
        
    required_weight = ROLE_WEIGHTS.get(required_role.upper(), 1)
    
    # Track the actual folder to check inheritance for
    current_folder_id = folder_id
    
    # 1. If file_id is provided, check file ownership and direct share
    if file_id:
        file = db.query(File).filter(File.id == file_id).first()
        if not file:
            return False # Resource doesn't exist
            
        if file.owner_id == user.id:
            return True
            
        current_folder_id = file.folder_id
        
        # Check direct share on the file
        share = db.query(Share).filter(Share.file_id == file_id, Share.recipient_id == user.id).first()
        if share and ROLE_WEIGHTS.get(share.role, 0) >= required_weight:
            return True

    # 2. Walk up the folder tree using ORM to prevent raw SQL dialect binding issues
    if current_folder_id:
        # Prevent infinite loops in case of hierarchy corruption
        max_depth = 50 
        current_node_id = current_folder_id
        depth = 0
        
        while current_node_id and depth < max_depth:
            # Check folder ownership
            folder = db.query(Folder).filter(Folder.id == current_node_id).first()
            if not folder:
                break
                
            if folder.owner_id == user.id:
                return True
                
            # Check share on this folder
            share = db.query(Share).filter(Share.folder_id == current_node_id, Share.recipient_id == user.id).first()
            if share and ROLE_WEIGHTS.get(share.role, 0) >= required_weight:
                return True
                
            # Move up the tree
            current_node_id = folder.parent_id
            depth += 1
            
    return False

def require_permission(
    db: Session,
    user: User,
    required_role: str,
    file_id: Optional[uuid.UUID] = None,
    folder_id: Optional[uuid.UUID] = None
):
    """
    Raises HTTP 403 if the user does not have the required permission.
    Raises HTTP 404 if resource is not found (indirectly, if check fails).
    """
    if not check_permission(db, user, required_role, file_id, folder_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to perform this action"
        )
