import json
import os
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.config import settings
from app.models.user import User
from app.models.meeting import Meeting, MeetingStatus
from app.models.speaker import Speaker
from app.models.action_item import ActionItem
from app.models.transcript import TranscriptSegment
from app.core.deps import get_current_user
from app.schemas.meeting import (
    MeetingListOut,
    MeetingDetailOut,
    SpeakerRename,
    ActionItemOut,
    ActionItemUpdate,
)
from app.services.pipeline_service import process_meeting

router = APIRouter(prefix="/api/meetings", tags=["meetings"])

ALLOWED_EXTENSIONS = {".mp3", ".wav", ".m4a", ".webm", ".ogg", ".mp4"}


@router.post("", response_model=MeetingListOut, status_code=201)
async def upload_meeting(
    background_tasks: BackgroundTasks,
    title: str = Form(...),
    description: str | None = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")

    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)

    stored_name = f"{uuid.uuid4()}{ext}"
    dest_path = upload_dir / stored_name

    with dest_path.open("wb") as f:
        while chunk := await file.read(1024 * 1024):
            f.write(chunk)

    meeting = Meeting(
        owner_id=current_user.id,
        title=title,
        description=description,
        audio_path=str(dest_path),
        status=MeetingStatus.UPLOADED,
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)

    # Kick off transcription -> diarization -> summary -> indexing pipeline
    background_tasks.add_task(process_meeting, str(meeting.id), db)

    return meeting


@router.get("", response_model=list[MeetingListOut])
def list_meetings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Meeting)
        .filter(Meeting.owner_id == current_user.id)
        .order_by(Meeting.created_at.desc())
        .all()
    )


@router.get("/{meeting_id}", response_model=MeetingDetailOut)
def get_meeting(
    meeting_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    meeting = (
        db.query(Meeting)
        .options(
            joinedload(Meeting.segments).joinedload(TranscriptSegment.speaker),
            joinedload(Meeting.speakers),
            joinedload(Meeting.action_items),
        )
        .filter(Meeting.id == meeting_id, Meeting.owner_id == current_user.id)
        .first()
    )
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    data = {
        "id": meeting.id,
        "title": meeting.title,
        "description": meeting.description,
        "status": meeting.status,
        "error_message": meeting.error_message,
        "duration_seconds": meeting.duration_seconds,
        "summary": meeting.summary,
        "key_points": json.loads(meeting.key_points) if meeting.key_points else [],
        "created_at": meeting.created_at,
        "updated_at": meeting.updated_at,
        "speakers": meeting.speakers,
        "segments": meeting.segments,
        "action_items": meeting.action_items,
    }
    return MeetingDetailOut.model_validate(data)


@router.delete("/{meeting_id}", status_code=204)
def delete_meeting(
    meeting_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    meeting = (
        db.query(Meeting)
        .filter(Meeting.id == meeting_id, Meeting.owner_id == current_user.id)
        .first()
    )
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    if meeting.audio_path and os.path.exists(meeting.audio_path):
        os.remove(meeting.audio_path)

    db.delete(meeting)
    db.commit()


@router.patch("/{meeting_id}/speakers/{speaker_id}", response_model=None)
def rename_speaker(
    meeting_id: uuid.UUID,
    speaker_id: uuid.UUID,
    payload: SpeakerRename,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    speaker = (
        db.query(Speaker)
        .join(Meeting)
        .filter(
            Speaker.id == speaker_id,
            Speaker.meeting_id == meeting_id,
            Meeting.owner_id == current_user.id,
        )
        .first()
    )
    if not speaker:
        raise HTTPException(status_code=404, detail="Speaker not found")

    speaker.display_name = payload.display_name
    db.commit()
    return {"ok": True}


@router.patch("/{meeting_id}/action-items/{item_id}", response_model=ActionItemOut)
def update_action_item(
    meeting_id: uuid.UUID,
    item_id: uuid.UUID,
    payload: ActionItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = (
        db.query(ActionItem)
        .join(Meeting)
        .filter(
            ActionItem.id == item_id,
            ActionItem.meeting_id == meeting_id,
            Meeting.owner_id == current_user.id,
        )
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Action item not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, field, value)

    db.commit()
    db.refresh(item)
    return item