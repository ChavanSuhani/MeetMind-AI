import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.meeting import Meeting, MeetingStatus
from app.models.chat import ChatMessage, ChatRole
from app.core.deps import get_current_user
from app.schemas.meeting import ChatAskRequest, ChatMessageOut
from app.services.rag_service import ask_question

router = APIRouter(prefix="/api/meetings/{meeting_id}/chat", tags=["chat"])


def _get_owned_meeting(meeting_id: uuid.UUID, db: Session, user: User) -> Meeting:
    meeting = (
        db.query(Meeting)
        .filter(Meeting.id == meeting_id, Meeting.owner_id == user.id)
        .first()
    )
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting


@router.get("", response_model=list[ChatMessageOut])
def get_chat_history(
    meeting_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_owned_meeting(meeting_id, db, current_user)
    return (
        db.query(ChatMessage)
        .filter(ChatMessage.meeting_id == meeting_id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )


@router.post("", response_model=ChatMessageOut)
def ask(
    meeting_id: uuid.UUID,
    payload: ChatAskRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    meeting = _get_owned_meeting(meeting_id, db, current_user)

    if meeting.status != MeetingStatus.COMPLETED:
        raise HTTPException(
            status_code=409,
            detail="This meeting hasn't finished processing yet. Please wait for it to complete.",
        )

    user_msg = ChatMessage(meeting_id=meeting.id, role=ChatRole.USER, content=payload.question)
    db.add(user_msg)
    db.commit()

    answer_text = ask_question(str(meeting.id), payload.question)

    assistant_msg = ChatMessage(meeting_id=meeting.id, role=ChatRole.ASSISTANT, content=answer_text)
    db.add(assistant_msg)
    db.commit()
    db.refresh(assistant_msg)

    return assistant_msg
