from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from app.schemas.file import FileResponse

class FolderCreate(BaseModel):
    name: str = Field(..., description="Name of the folder")
    parent_id: Optional[UUID] = Field(None, description="Optional parent folder ID (null for root)")

class FolderUpdate(BaseModel):
    name: Optional[str] = Field(None, description="New name for the folder")
    parent_id: Optional[UUID] = Field(None, description="New parent folder ID to move the folder")

class FolderResponse(BaseModel):
    id: UUID
    owner_id: UUID
    parent_id: Optional[UUID] = None
    name: str
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class Breadcrumb(BaseModel):
    id: Optional[UUID]  # None for root
    name: str

class FolderContentsResponse(BaseModel):
    folders: List[FolderResponse]
    files: List[FileResponse]
