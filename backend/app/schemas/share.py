from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator, ConfigDict
from datetime import datetime
import uuid

class ShareCreate(BaseModel):
    file_id: Optional[uuid.UUID] = None
    folder_id: Optional[uuid.UUID] = None
    recipient_email: EmailStr
    role: str # VIEWER or EDITOR
    
    @field_validator('role')
    @classmethod
    def validate_role(cls, v):
        if v not in ['VIEWER', 'EDITOR']:
            raise ValueError('Role must be VIEWER or EDITOR')
        return v
        
    @field_validator('folder_id')
    @classmethod
    def check_file_or_folder(cls, v, info):
        file_id = info.data.get('file_id')
        if not file_id and not v:
            raise ValueError('Either file_id or folder_id must be provided')
        if file_id and v:
            raise ValueError('Cannot share both file and folder at the same time')
        return v

class ShareUpdate(BaseModel):
    role: str
    
    @field_validator('role')
    @classmethod
    def validate_role(cls, v):
        if v not in ['VIEWER', 'EDITOR']:
            raise ValueError('Role must be VIEWER or EDITOR')
        return v

class UserBasic(BaseModel):
    id: uuid.UUID
    email: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None

class ShareResponse(BaseModel):
    id: uuid.UUID
    file_id: Optional[uuid.UUID] = None
    folder_id: Optional[uuid.UUID] = None
    role: str
    created_at: datetime
    recipient: UserBasic
    created_by: UserBasic

    model_config = ConfigDict(from_attributes=True)
