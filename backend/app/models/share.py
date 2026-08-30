import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, CheckConstraint, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base

class Share(Base):
    __tablename__ = "shares"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    recipient_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    file_id = Column(UUID(as_uuid=True), ForeignKey("files.id", ondelete="CASCADE"), nullable=True, index=True)
    folder_id = Column(UUID(as_uuid=True), ForeignKey("folders.id", ondelete="CASCADE"), nullable=True, index=True)
    
    role = Column(String, nullable=False) # VIEWER, EDITOR
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    created_by = relationship("User", foreign_keys=[created_by_id])
    recipient = relationship("User", foreign_keys=[recipient_id])
    file = relationship("File")
    folder = relationship("Folder")

    __table_args__ = (
        CheckConstraint(
            '(file_id IS NULL AND folder_id IS NOT NULL) OR (file_id IS NOT NULL AND folder_id IS NULL)',
            name='chk_share_resource_xor'
        ),
        UniqueConstraint('recipient_id', 'file_id', name='uq_share_recipient_file'),
        UniqueConstraint('recipient_id', 'folder_id', name='uq_share_recipient_folder'),
    )
