from datetime import datetime
from uuid import UUID
from pydantic import BaseModel

from app.models.meeting import MeetingStatus
from app.models.action_item import ActionItemPriority


class SpeakerOut(BaseModel):
    id: UUID
    diarization_label: str
    display_name: str | None
    color: str

    class Config:
        from_attributes = True


class SpeakerRename(BaseModel):
    display_name: str


class TranscriptSegmentOut(BaseModel):
    id: UUID
    start_time: float
    end_time: float
    text: str
    speaker: SpeakerOut | None = None

    class Config:
        from_attributes = True


class ActionItemOut(BaseModel):
    id: UUID
    description: str
    assignee: str | None
    due_date: datetime | None
    priority: ActionItemPriority
    is_completed: bool

    class Config:
        from_attributes = True


class ActionItemUpdate(BaseModel):
    description: str | None = None
    assignee: str | None = None
    due_date: datetime | None = None
    priority: ActionItemPriority | None = None
    is_completed: bool | None = None


class MeetingCreate(BaseModel):
    title: str
    description: str | None = None


class MeetingListOut(BaseModel):
    id: UUID
    title: str
    status: MeetingStatus
    duration_seconds: float | None
    created_at: datetime

    class Config:
        from_attributes = True


class MeetingDetailOut(BaseModel):
    id: UUID
    title: str
    description: str | None
    status: MeetingStatus
    error_message: str | None
    duration_seconds: float | None
    summary: str | None
    key_points: list[str] | None = []
    created_at: datetime
    updated_at: datetime
    speakers: list[SpeakerOut] = []
    segments: list[TranscriptSegmentOut] = []
    action_items: list[ActionItemOut] = []

    class Config:
        from_attributes = True


class ChatAskRequest(BaseModel):
    question: str


class ChatMessageOut(BaseModel):
    id: UUID
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True
