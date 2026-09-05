import uuid
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from sqlalchemy import or_

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.folder import Folder
from app.models.file import File
from app.schemas.folder import (
    FolderCreate,
    FolderResponse,
    FolderUpdate,
    FolderContentsResponse,
    Breadcrumb
)
from app.schemas.file import FileResponse
from app.services.storage import storage_service
from app.services.permissions import require_permission

router = APIRouter()

def validate_circular_hierarchy(db: Session, folder_id: uuid.UUID, new_parent_id: uuid.UUID) -> None:
    """Ensure that moving folder_id to new_parent_id doesn't create a loop."""
    if folder_id == new_parent_id:
        raise HTTPException(status_code=400, detail="A folder cannot be moved into itself.")
        
    current_parent = new_parent_id
    while current_parent is not None:
        if current_parent == folder_id:
            raise HTTPException(status_code=400, detail="Cannot move a folder into its own descendant.")
            
        parent_folder = db.query(Folder).filter(Folder.id == current_parent).first()
        if not parent_folder:
            break
        current_parent = parent_folder.parent_id

def recursive_soft_delete_folder(db: Session, folder_id: uuid.UUID, delete_time: datetime) -> None:
    """Recursively soft delete a folder and all its descendants (folders and files)."""
    # Delete children folders recursively
    children = db.query(Folder).filter(Folder.parent_id == folder_id, Folder.deleted_at.is_(None)).all()
    for child in children:
        child.deleted_at = delete_time
        recursive_soft_delete_folder(db, child.id, delete_time)
        
    # Delete files in this folder
    files = db.query(File).filter(File.folder_id == folder_id, File.deleted_at.is_(None)).all()
    for file in files:
        file.deleted_at = delete_time

@router.post("", response_model=FolderResponse, status_code=status.HTTP_201_CREATED)
def create_folder(
    request: FolderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Create a new folder."""
    if request.parent_id:
        parent_folder = db.query(Folder).filter(Folder.id == request.parent_id, Folder.deleted_at.is_(None)).first()
        if not parent_folder:
            raise HTTPException(status_code=404, detail="Parent folder not found.")
        require_permission(db, current_user, "EDITOR", folder_id=request.parent_id)

    # Check for duplicate names
    # Note: For shared folders, owner might be different, but we check within the destination folder.
    existing = db.query(Folder).filter(
        Folder.owner_id == (parent_folder.owner_id if request.parent_id else current_user.id),
        Folder.parent_id == request.parent_id,
        Folder.name == request.name,
        Folder.deleted_at.is_(None)
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="A folder with this name already exists in this location.")

    new_folder = Folder(
        owner_id=current_user.id,
        parent_id=request.parent_id,
        name=request.name
    )
    db.add(new_folder)
    db.commit()
    db.refresh(new_folder)
    return new_folder

@router.get("/{id}", response_model=FolderResponse)
def get_folder(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Get folder metadata."""
    folder = db.query(Folder).filter(Folder.id == id, Folder.deleted_at.is_(None)).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found.")
    require_permission(db, current_user, "VIEWER", folder_id=id)
    return folder

@router.patch("/{id}", response_model=FolderResponse)
def update_folder(
    id: uuid.UUID,
    request: FolderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Rename or move a folder."""
    folder = db.query(Folder).filter(Folder.id == id, Folder.deleted_at.is_(None)).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found.")
    require_permission(db, current_user, "EDITOR", folder_id=id)

    if request.name is not None and request.name != folder.name:
        # Check duplicate name
        existing = db.query(Folder).filter(
            Folder.owner_id == folder.owner_id,
            Folder.parent_id == folder.parent_id,
            Folder.name == request.name,
            Folder.deleted_at.is_(None)
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="A folder with this name already exists.")
        folder.name = request.name

    if request.parent_id is not None and request.parent_id != folder.parent_id:
        # Validate new parent
        require_permission(db, current_user, "EDITOR", folder_id=request.parent_id)
        
        # Prevent circular hierarchy
        validate_circular_hierarchy(db, folder.id, request.parent_id)
        
        # Check name collision in new parent
        # The destination folder owner dictates the namespace
        dest_owner_id = db.query(Folder).filter(Folder.id == request.parent_id).first().owner_id if request.parent_id else folder.owner_id
        existing = db.query(Folder).filter(
            Folder.owner_id == dest_owner_id,
            Folder.parent_id == request.parent_id,
            Folder.name == folder.name,
            Folder.deleted_at.is_(None)
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="A folder with this name already exists in the destination.")
            
        folder.parent_id = request.parent_id

    folder.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(folder)
    return folder

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_folder(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Soft delete a folder and all its contents recursively."""
    folder = db.query(Folder).filter(Folder.id == id, Folder.deleted_at.is_(None)).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found.")
    require_permission(db, current_user, "OWNER", folder_id=id)

    delete_time = datetime.now(timezone.utc)
    folder.deleted_at = delete_time
    recursive_soft_delete_folder(db, folder.id, delete_time)
    
    db.commit()
    return None

@router.get("/{id}/contents", response_model=FolderContentsResponse)
def get_folder_contents(
    id: str, # UUID or 'root'
    sort_by: str = "name",
    order: str = "asc",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """List contents of a folder (or root)."""
    if id == "root":
        folder_id = None
    else:
        try:
            folder_id = uuid.UUID(id)
            folder = db.query(Folder).filter(Folder.id == folder_id, Folder.deleted_at.is_(None)).first()
            if not folder:
                raise HTTPException(status_code=404, detail="Folder not found.")
            require_permission(db, current_user, "VIEWER", folder_id=folder_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid folder ID format.")

    # Base queries
    if folder_id is None:
        # At root, only show items owned by user (Shared with me can be a separate endpoint, or combined later)
        folder_query = db.query(Folder).filter(
            Folder.owner_id == current_user.id,
            Folder.parent_id == None,
            Folder.deleted_at.is_(None)
        )
        
        file_query = db.query(File).filter(
            File.owner_id == current_user.id,
            File.folder_id == None,
            File.deleted_at.is_(None)
        )
    else:
        # If looking at a specific folder, show all contents (permission is inherited)
        folder_query = db.query(Folder).filter(
            Folder.parent_id == folder_id,
            Folder.deleted_at.is_(None)
        )
        
        file_query = db.query(File).filter(
            File.folder_id == folder_id,
            File.deleted_at.is_(None)
        )

    # Sorting safely
    valid_folder_sort = {"name": Folder.name, "created_at": Folder.created_at}
    valid_file_sort = {"name": File.original_filename, "created_at": File.created_at, "size": File.size}
    
    if sort_by in valid_folder_sort:
        if order == "desc":
            folder_query = folder_query.order_by(valid_folder_sort[sort_by].desc())
        else:
            folder_query = folder_query.order_by(valid_folder_sort[sort_by].asc())
            
    if sort_by in valid_file_sort:
        if order == "desc":
            file_query = file_query.order_by(valid_file_sort[sort_by].desc())
        else:
            file_query = file_query.order_by(valid_file_sort[sort_by].asc())

    folders = folder_query.all()
    files = file_query.all()

    # Generate presigned URLs for files if needed (optional for listing, but useful for icons/previews)
    # However, since download urls are short-lived, we should only generate them when explicitly requested.
    return FolderContentsResponse(
        folders=folders,
        files=files
    )

@router.get("/{id}/breadcrumbs", response_model=List[Breadcrumb])
def get_breadcrumbs(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Get breadcrumbs from root to the specified folder."""
    breadcrumbs = []
    
    if id == "root":
        return [{"id": None, "name": "My Drive"}]
        
    try:
        folder_id = uuid.UUID(id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid folder ID format.")
        
    current_folder = db.query(Folder).filter(Folder.id == folder_id, Folder.deleted_at.is_(None)).first()
    if not current_folder:
        raise HTTPException(status_code=404, detail="Folder not found.")
    
    # Needs to be able to at least view it
    require_permission(db, current_user, "VIEWER", folder_id=folder_id)
        
    while current_folder:
        breadcrumbs.append({"id": current_folder.id, "name": current_folder.name})
        if current_folder.parent_id:
            current_folder = db.query(Folder).filter(Folder.id == current_folder.parent_id).first()
        else:
            break
            
    breadcrumbs.append({"id": None, "name": "My Drive"})
    breadcrumbs.reverse()
    
    return breadcrumbs
