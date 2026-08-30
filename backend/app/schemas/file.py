from pydantic import BaseModel, ConfigDict, Field, validator
from typing import Optional, Any
from uuid import UUID
from datetime import datetime

class FileInitUploadRequest(BaseModel):
    filename: str = Field(..., description="Original filename of the file")
    mime_type: str = Field(..., description="MIME type of the file")
    size: int = Field(..., gt=0, description="Size of the file in bytes")
    folder_id: Optional[UUID] = Field(None, description="Optional folder ID")

class FileInitUploadResponse(BaseModel):
    file_id: UUID
    storage_path: str
    presigned_url: str
    form_data: dict[str, Any] = Field(
        default_factory=dict, 
        description="Form data fields needed for POST upload if using S3 presigned POST"
    )

class FileCompleteUploadRequest(BaseModel):
    file_id: UUID

class FileUpdate(BaseModel):
    original_filename: Optional[str] = Field(None, description="New name for the file")
    folder_id: Optional[UUID] = Field(None, description="New folder ID to move the file to")

class FileResponse(BaseModel):
    id: UUID
    owner_id: UUID
    folder_id: Optional[UUID] = None
    original_filename: str
    mime_type: str
    extension: str
    size: int
    created_at: datetime
    updated_at: datetime
    download_url: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)
