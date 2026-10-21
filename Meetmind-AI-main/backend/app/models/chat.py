import uuid
import enum
from datetime import datetime

from sqlalchemy import Column, ForeignKey, DateTime, Enum, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class ChatRole(str, enum.Enum):
    USER = "user"
    ASSISTANT = "assistant"


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    meeting_id = Column(UUID(as_uuid=True), ForeignKey("meetings.id"), nullable=False)

    role = Column(Enum(ChatRole), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    meeting = relationship("Meeting", back_populates="chat_messages")
