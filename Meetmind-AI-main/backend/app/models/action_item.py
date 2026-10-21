import uuid
import enum
from datetime import datetime

from sqlalchemy import Column, String, ForeignKey, Boolean, DateTime, Enum, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class ActionItemPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class ActionItem(Base):
    __tablename__ = "action_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    meeting_id = Column(UUID(as_uuid=True), ForeignKey("meetings.id"), nullable=False)

    description = Column(Text, nullable=False)
    assignee = Column(String(120), nullable=True)
    due_date = Column(DateTime, nullable=True)
    priority = Column(Enum(ActionItemPriority), default=ActionItemPriority.MEDIUM)
    is_completed = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    meeting = relationship("Meeting", back_populates="action_items")
