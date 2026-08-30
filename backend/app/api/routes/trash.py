import uuid
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.folder import Folder
from app.models.file import File
from app.services.storage import storage_service
from pydantic import BaseModel

class TrashItem(BaseModel):
    id: uuid.UUID
    type: str # 'file' or 'folder'
    name: str
    deleted_at: datetime
    original_parent_id: Optional[uuid.UUID]
    size: Optional[int]
    mime_type: Optional[str]

class TrashResponse(BaseModel):
    items: List[TrashItem]

router = APIRouter()

@router.get("", response_model=TrashResponse)
def get_trash(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Get all soft-deleted files and folders owned by the user."""
    results = []
    
    # Get deleted folders
    folders = db.query(Folder).filter(
        Folder.owner_id == current_user.id,
        Folder.deleted_at.is_not(None)
    ).all()
    
    for f in folders:
        # Optimization: Only show top-level deleted folders or all?
        # A simple approach for MVP is to return all. The spec doesn't mandate filtering children.
        # But we only want to show the top-level items the user explicitly deleted.
        # Let's just return all for simplicity.
        results.append(TrashItem(
            id=f.id,
            type="folder",
            name=f.name,
            deleted_at=f.deleted_at,
            original_parent_id=f.parent_id,
            size=None,
            mime_type=None
        ))
        
    # Get deleted files
    files = db.query(File).filter(
        File.owner_id == current_user.id,
        File.deleted_at.is_not(None)
    ).all()
    
    for f in files:
        results.append(TrashItem(
            id=f.id,
            type="file",
            name=f.original_filename,
            deleted_at=f.deleted_at,
            original_parent_id=f.folder_id,
            size=f.size,
            mime_type=f.mime_type
        ))
        
    # Sort by deleted_at desc
    results.sort(key=lambda x: x.deleted_at, reverse=True)
    
    return TrashResponse(items=results)

def handle_name_conflict(db: Session, folder_id: Optional[uuid.UUID], name: str, is_file: bool) -> str:
    """Generates a safe name if conflict exists."""
    base_name = name
    counter = 1
    while True:
        if is_file:
            existing = db.query(File).filter(
                File.folder_id == folder_id,
                File.original_filename == name,
                File.deleted_at.is_(None)
            ).first()
        else:
            existing = db.query(Folder).filter(
                Folder.parent_id == folder_id,
                Folder.name == name,
                Folder.deleted_at.is_(None)
            ).first()
            
        if not existing:
            return name
            
        if is_file and "." in base_name:
            parts = base_name.rsplit(".", 1)
            name = f"{parts[0]} (Restored {counter}).{parts[1]}"
        else:
            name = f"{base_name} (Restored {counter})"
        counter += 1

def restore_folder_recursively(db: Session, folder_id: uuid.UUID, deleted_time: datetime) -> None:
    # Restore children that were deleted at the same time
    children = db.query(Folder).filter(
        Folder.parent_id == folder_id,
        Folder.deleted_at == deleted_time
    ).all()
    
    for child in children:
        child.deleted_at = None
        restore_folder_recursively(db, child.id, deleted_time)
        
    files = db.query(File).filter(
        File.folder_id == folder_id,
        File.deleted_at == deleted_time
    ).all()
    
    for file in files:
        file.deleted_at = None

@router.post("/{id}/restore", status_code=status.HTTP_200_OK)
def restore_item(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Restore a file or folder from trash."""
    # Try folder first
    folder = db.query(Folder).filter(Folder.id == id, Folder.owner_id == current_user.id).first()
    if folder and folder.deleted_at:
        # Check if parent is deleted
        if folder.parent_id:
            parent = db.query(Folder).filter(Folder.id == folder.parent_id).first()
            if not parent or parent.deleted_at:
                folder.parent_id = None # Restore to root
        
        folder.name = handle_name_conflict(db, folder.parent_id, folder.name, False)
        deleted_time = folder.deleted_at
        folder.deleted_at = None
        
        # Recursively restore children
        restore_folder_recursively(db, folder.id, deleted_time)
        
        db.commit()
        return {"status": "success", "type": "folder", "id": folder.id}
        
    # Try file
    file = db.query(File).filter(File.id == id, File.owner_id == current_user.id).first()
    if file and file.deleted_at:
        # Check if parent is deleted
        if file.folder_id:
            parent = db.query(Folder).filter(Folder.id == file.folder_id).first()
            if not parent or parent.deleted_at:
                file.folder_id = None # Restore to root
                
        file.original_filename = handle_name_conflict(db, file.folder_id, file.original_filename, True)
        file.deleted_at = None
        db.commit()
        return {"status": "success", "type": "file", "id": file.id}
        
    raise HTTPException(status_code=404, detail="Item not found in trash.")

def hard_delete_folder_recursively(db: Session, folder_id: uuid.UUID) -> None:
    # Delete child folders
    children = db.query(Folder).filter(Folder.parent_id == folder_id).all()
    for child in children:
        hard_delete_folder_recursively(db, child.id)
        db.delete(child)
        
    # Delete files
    files = db.query(File).filter(File.folder_id == folder_id).all()
    for file in files:
        if file.storage_path:
            storage_service.delete_object(file.storage_path)
        db.delete(file)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def permanent_delete_item(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> None:
    """Permanently delete a file or folder from trash."""
    # Try folder
    folder = db.query(Folder).filter(Folder.id == id, Folder.owner_id == current_user.id, Folder.deleted_at.is_not(None)).first()
    if folder:
        hard_delete_folder_recursively(db, folder.id)
        db.delete(folder)
        db.commit()
        return None
        
    # Try file
    file = db.query(File).filter(File.id == id, File.owner_id == current_user.id, File.deleted_at.is_not(None)).first()
    if file:
        if file.storage_path:
            storage_service.delete_object(file.storage_path)
        db.delete(file)
        db.commit()
        return None
        
    raise HTTPException(status_code=404, detail="Item not found in trash.")
