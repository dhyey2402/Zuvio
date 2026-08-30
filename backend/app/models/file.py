import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Index, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base
class File(Base):
    __tablename__ = "files"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    folder_id = Column(UUID(as_uuid=True), ForeignKey("folders.id", ondelete="CASCADE"), nullable=True, index=True)
    
    original_filename = Column(String, nullable=False, index=True)
    storage_path = Column(String, nullable=False, unique=True, index=True)

    # Relationships
    folder = relationship("Folder", back_populates="files")
    mime_type = Column(String, nullable=False)
    extension = Column(String, nullable=False)
    size = Column(Integer, nullable=False)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True, index=True)

    # Indexes
    __table_args__ = (
        Index('ix_files_owner_folder', 'owner_id', 'folder_id'),
        UniqueConstraint('owner_id', 'folder_id', 'original_filename', name='uq_file_name_per_folder'),
    )
