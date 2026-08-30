from typing import Optional
from pydantic import BaseModel, validator
from datetime import datetime
import uuid

class PublicLinkCreate(BaseModel):
    file_id: Optional[uuid.UUID] = None
    folder_id: Optional[uuid.UUID] = None
    role: str # VIEWER or EDITOR
    password: Optional[str] = None
    expires_in_days: Optional[int] = None
    
    @validator('role')
    def validate_role(cls, v):
        if v not in ['VIEWER', 'EDITOR']:
            raise ValueError('Role must be VIEWER or EDITOR')
        return v
        
    @validator('folder_id', always=True)
    def check_file_or_folder(cls, v, values):
        file_id = values.get('file_id')
        if not file_id and not v:
            raise ValueError('Either file_id or folder_id must be provided')
        if file_id and v:
            raise ValueError('Cannot share both file and folder at the same time')
        return v

class PublicLinkResponse(BaseModel):
    token: str
    file_id: Optional[uuid.UUID] = None
    folder_id: Optional[uuid.UUID] = None
    role: str
    expires_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        orm_mode = True

class PublicLinkAccess(BaseModel):
    password: Optional[str] = None
