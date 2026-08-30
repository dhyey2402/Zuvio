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

    # 2. Walk up the folder tree using a recursive CTE to prevent N+1 queries
    if current_folder_id:
        from sqlalchemy import text
        query = text("""
            WITH RECURSIVE folder_path AS (
                SELECT id, parent_id, owner_id
                FROM folders
                WHERE id = :folder_id
                
                UNION ALL
                
                SELECT f.id, f.parent_id, f.owner_id
                FROM folders f
                INNER JOIN folder_path fp ON f.id = fp.parent_id
            )
            SELECT fp.owner_id, s.role
            FROM folder_path fp
            LEFT JOIN shares s ON s.folder_id = fp.id AND s.recipient_id = :user_id
        """)
        
        result = db.execute(query, {"folder_id": current_folder_id, "user_id": user.id}).fetchall()
        
        for row in result:
            # Check ownership
            if row.owner_id == user.id:
                return True
                
            # Check share on this folder
            if row.role and ROLE_WEIGHTS.get(row.role, 0) >= required_weight:
                return True
        
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
