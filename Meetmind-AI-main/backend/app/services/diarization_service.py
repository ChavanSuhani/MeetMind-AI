"""
Speaker diarization powered by pyannote.audio.

Requires a HuggingFace token with access to the pyannote/speaker-diarization
gated model (set HUGGINGFACE_TOKEN in .env).
"""
from functools import lru_cache

from pyannote.audio import Pipeline

from app.config import settings


@lru_cache(maxsize=1)
def _get_pipeline():
    return Pipeline.from_pretrained(
        "pyannote/speaker-diarization-3.1",
        use_auth_token=settings.HUGGINGFACE_TOKEN,
    )


def diarize_audio(audio_path: str) -> list[dict]:
    """
    Returns a list of {start, end, speaker_label} dicts, one per speech turn,
    e.g. [{"start": 0.5, "end": 4.2, "speaker": "SPEAKER_00"}, ...]
    """
    pipeline = _get_pipeline()
    diarization = pipeline(audio_path)

    turns = []
    for turn, _, speaker_label in diarization.itertracks(yield_label=True):
        turns.append({
            "start": turn.start,
            "end": turn.end,
            "speaker": speaker_label,
        })
    return turns


def assign_speakers_to_segments(whisper_segments: list[dict], diarization_turns: list[dict]) -> list[dict]:
    """
    Merge Whisper transcript segments with pyannote diarization turns by picking
    the diarization speaker whose turn has the greatest time overlap with each
    transcript segment.
    """
    def overlap(seg_start, seg_end, turn_start, turn_end):
        return max(0.0, min(seg_end, turn_end) - max(seg_start, turn_start))

    merged = []
    for seg in whisper_segments:
        best_speaker = None
        best_overlap = 0.0
        for turn in diarization_turns:
            ov = overlap(seg["start"], seg["end"], turn["start"], turn["end"])
            if ov > best_overlap:
                best_overlap = ov
                best_speaker = turn["speaker"]

        merged.append({
            **seg,
            "speaker": best_speaker or "SPEAKER_UNKNOWN",
        })
    return merged
