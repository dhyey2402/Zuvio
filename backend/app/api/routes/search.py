import uuid
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session, aliased
from sqlalchemy import or_, text, literal_column
from datetime import datetime

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.folder import Folder
from app.models.file import File
from app.models.share import Share

from pydantic import BaseModel

class SearchResultItem(BaseModel):
    id: uuid.UUID
    type: str # 'file' or 'folder'
    name: str
    parent_id: Optional[uuid.UUID]
    created_at: datetime
    updated_at: datetime
    size: Optional[int]
    mime_type: Optional[str]
    owner_id: uuid.UUID

class SearchResponse(BaseModel):
    items: List[SearchResultItem]
    total: int
    page: int
    limit: int

router = APIRouter()

@router.get("", response_model=SearchResponse)
def search_resources(
    q: str = Query(..., min_length=1),
    type: Optional[str] = Query(None, description="Filter by type: 'file' or 'folder'"),
    folder_id: Optional[uuid.UUID] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    sort: str = Query("name", description="Sort by: name, created_at, size"),
    order: str = Query("asc", description="Sort order: asc or desc"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Search for files and folders.
    Only returns resources the user is authorized to discover.
    Excludes soft-deleted resources.
    """
    # 1. Build CTE for accessible folders
    accessible_folders = db.query(Folder.id).outerjoin(
        Share, (Share.folder_id == Folder.id) & (Share.recipient_id == current_user.id)
    ).filter(
        or_(Folder.owner_id == current_user.id, Share.id != None),
        Folder.deleted_at.is_(None)
    ).cte(name="accessible_folders", recursive=True)

    folder_alias = aliased(Folder)
    accessible_folders = accessible_folders.union_all(
        db.query(folder_alias.id).join(
            accessible_folders, folder_alias.parent_id == accessible_folders.c.id
        ).filter(
            folder_alias.deleted_at.is_(None)
        )
    )

    results = []
    search_term = f"%{q}%"

    # 2. Query Folders
    if type is None or type == "folder":
        folder_query = db.query(Folder).filter(
            Folder.deleted_at.is_(None),
            Folder.name.ilike(search_term),
            Folder.id.in_(db.query(accessible_folders.c.id))
        )
        if folder_id:
            folder_query = folder_query.filter(Folder.parent_id == folder_id)

        for folder in folder_query.all():
            results.append(SearchResultItem(
                id=folder.id,
                type="folder",
                name=folder.name,
                parent_id=folder.parent_id,
                created_at=folder.created_at,
                updated_at=folder.updated_at,
                size=None,
                mime_type=None,
                owner_id=folder.owner_id
            ))

    # 3. Query Files
    if type is None or type == "file":
        file_query = db.query(File).filter(
            File.deleted_at.is_(None),
            File.original_filename.ilike(search_term),
            or_(
                File.owner_id == current_user.id,
                File.folder_id.in_(db.query(accessible_folders.c.id)),
                File.id.in_(db.query(Share.file_id).filter(Share.recipient_id == current_user.id))
            )
        )
        if folder_id:
            file_query = file_query.filter(File.folder_id == folder_id)

        for file in file_query.all():
            results.append(SearchResultItem(
                id=file.id,
                type="file",
                name=file.original_filename,
                parent_id=file.folder_id,
                created_at=file.created_at,
                updated_at=file.updated_at,
                size=file.size,
                mime_type=file.mime_type,
                owner_id=file.owner_id
            ))

    # 4. Sorting & Pagination in Python
    if sort == "name":
        results.sort(key=lambda x: x.name.lower(), reverse=(order == "desc"))
    elif sort == "created_at":
        results.sort(key=lambda x: x.created_at, reverse=(order == "desc"))
    elif sort == "size":
        results.sort(key=lambda x: x.size or 0, reverse=(order == "desc"))

    total = len(results)
    start = (page - 1) * limit
    end = start + limit
    paginated_results = results[start:end]

    return SearchResponse(
        items=paginated_results,
        total=total,
        page=page,
        limit=limit
    )
