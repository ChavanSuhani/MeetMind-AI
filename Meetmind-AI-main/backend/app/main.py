from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app import models  # noqa: F401  ensures models are registered on Base
from app.api import auth, meetings, chat

app = FastAPI(
    title="MeetMind AI",
    description="AI-powered meeting intelligence platform: transcription, "
                 "speaker diarization, summarization, and natural-language Q&A.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(meetings.router)
app.include_router(chat.router)


@app.on_event("startup")
def on_startup():
    # For production use Alembic migrations instead of create_all.
    Base.metadata.create_all(bind=engine)


@app.get("/api/health", tags=["health"])
def health_check():
    return {"status": "ok", "service": "MeetMind AI API"}
