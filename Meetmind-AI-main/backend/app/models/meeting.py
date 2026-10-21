import uuid
import enum
from datetime import datetime

from sqlalchemy import Column, String, DateTime, Float, ForeignKey, Enum, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class MeetingStatus(str, enum.Enum):
    UPLOADED = "uploaded"
    TRANSCRIBING = "transcribing"
    DIARIZING = "diarizing"
    SUMMARIZING = "summarizing"
    INDEXING = "indexing"
    COMPLETED = "completed"
    FAILED = "failed"


class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    audio_path = Column(String(500), nullable=True)
    duration_seconds = Column(Float, nullable=True)

    status = Column(Enum(MeetingStatus), default=MeetingStatus.UPLOADED)
    error_message = Column(Text, nullable=True)

    summary = Column(Text, nullable=True)
    key_points = Column(Text, nullable=True)  # JSON-encoded list

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("User", back_populates="meetings")
    segments = relationship("TranscriptSegment", back_populates="meeting", cascade="all, delete-orphan", order_by="TranscriptSegment.start_time")
    speakers = relationship("Speaker", back_populates="meeting", cascade="all, delete-orphan")
    action_items = relationship("ActionItem", back_populates="meeting", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="meeting", cascade="all, delete-orphan")
