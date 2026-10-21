"""
Transcription service powered by OpenAI Whisper (runs locally, no API key needed).

Loading the model is expensive, so we cache it as a module-level singleton and
lazily load it on first use.
"""
from functools import lru_cache

import whisper

from app.config import settings


@lru_cache(maxsize=1)
def _get_model():
    return whisper.load_model(settings.WHISPER_MODEL_SIZE)


def transcribe_audio(audio_path: str) -> dict:
    """
    Transcribe an audio file and return Whisper's raw result, which includes:
      - "text": full transcript
      - "segments": list of {start, end, text, ...}
      - "language": detected language
    """
    model = _get_model()
    result = model.transcribe(audio_path, verbose=False, fp16=False)
    return result
