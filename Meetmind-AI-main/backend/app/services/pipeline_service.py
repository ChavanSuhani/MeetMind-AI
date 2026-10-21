"""
Orchestrates the end-to-end meeting processing pipeline:

  1. Transcribe audio (Whisper)
  2. Diarize speakers (pyannote.audio)
  3. Merge transcript + speaker labels
  4. Persist speakers + transcript segments to DB
  5. Generate summary / key points / action items (Gemini)
  6. Index transcript into ChromaDB for Q&A (LangChain)

Designed to be run in a background task/worker so the upload endpoint can
return immediately while processing continues.

import json
import traceback

from sqlalchemy.orm import Session

from app.models.meeting import Meeting, MeetingStatus
from app.models.speaker import Speaker
from app.models.transcript import TranscriptSegment
from app.models.action_item import ActionItem, ActionItemPriority
from app.services import transcription_service, diarization_service, summary_service, rag_service


def process_meeting(meeting_id: str, db: Session) -> None:
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if meeting is None:
        return

    try:
        # 1. Transcription
        meeting.status = MeetingStatus.TRANSCRIBING
        db.commit()
        whisper_result = transcription_service.transcribe_audio(meeting.audio_path)
        whisper_segments = [
            {"start": s["start"], "end": s["end"], "text": s["text"].strip()}
            for s in whisper_result["segments"]
        ]
        if whisper_segments:
            meeting.duration_seconds = whisper_segments[-1]["end"]

        # 2. Diarization
        meeting.status = MeetingStatus.DIARIZING
        db.commit()"""

"""
Orchestrates the end-to-end meeting processing pipeline:

  0. Normalize audio to a clean 16kHz mono WAV (ffmpeg) so every downstream
     library (Whisper, pyannote/soundfile) can read it reliably, regardless
     of the original upload format (webm, mp3, m4a, etc.)
  1. Transcribe audio (Whisper)
  2. Diarize speakers (pyannote.audio)
  3. Merge transcript + speaker labels
  4. Persist speakers + transcript segments to DB
  5. Generate summary / key points / action items (Groq)
  6. Index transcript into ChromaDB for Q&A (LangChain)

Designed to be run in a background task/worker so the upload endpoint can
return immediately while processing continues.
"""
import json
import subprocess
import traceback
from pathlib import Path

from sqlalchemy.orm import Session

from app.models.meeting import Meeting, MeetingStatus
from app.models.speaker import Speaker
from app.models.transcript import TranscriptSegment
from app.models.action_item import ActionItem, ActionItemPriority
from app.services import transcription_service, diarization_service, summary_service, rag_service


def _normalize_audio(original_path: str) -> str:
    """
    Converts any uploaded audio file (webm, mp3, m4a, etc.) into a clean
    16kHz mono WAV using ffmpeg, so Whisper and pyannote/soundfile can both
    read it reliably. Returns the path to the new WAV file.
    """
    src = Path(original_path)
    normalized_path = src.with_name(f"{src.stem}_normalized.wav")

    subprocess.run(
        [
            "ffmpeg", "-y",
            "-i", str(src),
            "-ar", "16000",
            "-ac", "1",
            "-c:a", "pcm_s16le",
            str(normalized_path),
        ],
        check=True,
        capture_output=True,
    )
    return str(normalized_path)


def process_meeting(meeting_id: str, db: Session) -> None:
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if meeting is None:
        return

    try:
        # 0. Normalize audio to a clean WAV before anything else
        normalized_audio_path = _normalize_audio(meeting.audio_path)

        # 1. Transcription
        meeting.status = MeetingStatus.TRANSCRIBING
        db.commit()
        whisper_result = transcription_service.transcribe_audio(normalized_audio_path)
        whisper_segments = [
            {"start": s["start"], "end": s["end"], "text": s["text"].strip()}
            for s in whisper_result["segments"]
        ]
        if whisper_segments:
            meeting.duration_seconds = whisper_segments[-1]["end"]

        # 2. Diarization
        meeting.status = MeetingStatus.DIARIZING
        db.commit()
        diarization_turns = diarization_service.diarize_audio(normalized_audio_path)
        merged_segments = diarization_service.assign_speakers_to_segments(
            whisper_segments, diarization_turns
        )

        # 3. Persist speakers
        label_to_speaker = {}
        palette = ["#6C63FF", "#00B8A9", "#F97316", "#EF4444", "#3B82F6", "#A855F7"]
        for i, label in enumerate(sorted({seg["speaker"] for seg in merged_segments})):
            speaker = Speaker(
                meeting_id=meeting.id,
                diarization_label=label,
                display_name=None,
                color=palette[i % len(palette)],
            )
            db.add(speaker)
            label_to_speaker[label] = speaker
        db.flush()

        # 4. Persist transcript segments
        for seg in merged_segments:
            db.add(TranscriptSegment(
                meeting_id=meeting.id,
                speaker_id=label_to_speaker[seg["speaker"]].id,
                start_time=seg["start"],
                end_time=seg["end"],
                text=seg["text"],
            ))
        db.commit()

        # 5. Summary + action items
        meeting.status = MeetingStatus.SUMMARIZING
        db.commit()
        transcript_text = "\n".join(
            f"{seg['speaker']}: {seg['text']}" for seg in merged_segments
        )
        intelligence = summary_service.generate_meeting_intelligence(transcript_text)

        meeting.summary = intelligence.get("summary", "")
        meeting.key_points = json.dumps(intelligence.get("key_points", []))

        for item in intelligence.get("action_items", []):
            priority = item.get("priority", "medium")
            if priority not in [p.value for p in ActionItemPriority]:
                priority = "medium"
            db.add(ActionItem(
                meeting_id=meeting.id,
                description=item.get("description", ""),
                assignee=item.get("assignee"),
                priority=ActionItemPriority(priority),
            ))
        db.commit()

        # 6. Index for Q&A
        meeting.status = MeetingStatus.INDEXING
        db.commit()
        rag_service.index_meeting_transcript(str(meeting.id), merged_segments)

        meeting.status = MeetingStatus.COMPLETED
        db.commit()

    except Exception as exc:  # noqa: BLE001
        meeting.status = MeetingStatus.FAILED
        meeting.error_message = f"{exc}\n{traceback.format_exc()}"
        db.commit()
