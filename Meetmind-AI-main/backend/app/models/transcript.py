import uuid

from sqlalchemy import Column, String, ForeignKey, Float, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class TranscriptSegment(Base):
    __tablename__ = "transcript_segments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    meeting_id = Column(UUID(as_uuid=True), ForeignKey("meetings.id"), nullable=False)
    speaker_id = Column(UUID(as_uuid=True), ForeignKey("speakers.id"), nullable=True)

    start_time = Column(Float, nullable=False)  # seconds
    end_time = Column(Float, nullable=False)
    text = Column(Text, nullable=False)

    meeting = relationship("Meeting", back_populates="segments")
    speaker = relationship("Speaker", back_populates="segments")
