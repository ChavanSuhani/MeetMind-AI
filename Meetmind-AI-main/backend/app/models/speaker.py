import uuid

from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Speaker(Base):
    __tablename__ = "speakers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    meeting_id = Column(UUID(as_uuid=True), ForeignKey("meetings.id"), nullable=False)

    diarization_label = Column(String(50), nullable=False)  # e.g. SPEAKER_00
    display_name = Column(String(120), nullable=True)  # user-editable friendly name
    color = Column(String(20), default="#6C63FF")

    meeting = relationship("Meeting", back_populates="speakers")
    segments = relationship("TranscriptSegment", back_populates="speaker")
