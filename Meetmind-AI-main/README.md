# MeetMind AI — AI-Powered Meeting Intelligence Platform

Upload or record meetings, automatically transcribe them, identify speakers, generate
AI summaries and action items, and ask natural-language questions about any past meeting.

## Stack

**Frontend:** React + TypeScript + Bootstrap 5 + React Router + Axios + Lucide React
**Backend:** FastAPI + SQLAlchemy + PostgreSQL + JWT auth
**AI:** OpenAI Whisper (transcription) · pyannote.audio (speaker diarization) ·
Google Gemini (summarization + Q&A) · LangChain + ChromaDB (retrieval-augmented Q&A)

## Project Structure

```
meetmind-ai/
├── backend/
│   ├── app/
│   │   ├── api/            # FastAPI routers: auth, meetings, chat
│   │   ├── core/            # security (JWT/password hashing), auth dependency
│   │   ├── models/          # SQLAlchemy ORM models
│   │   ├── schemas/         # Pydantic request/response schemas
│   │   ├── services/        # transcription, diarization, summary, RAG, pipeline
│   │   ├── uploads/          # uploaded audio files (dev storage)
│   │   ├── config.py
│   │   ├── database.py
│   │   └── main.py
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── pages/            # Login, Register, Dashboard, Upload, Recorder, MeetingDetail
    │   ├── components/       # Sidebar, MeetingCard, TranscriptView, SummaryPanel, ActionItems, ChatBox…
    │   ├── context/          # AuthContext
    │   ├── services/         # axios API client + auth/meeting service functions
    │   ├── types/
    │   └── styles/theme.css
    ├── package.json
    ├── vite.config.ts
    └── tsconfig.json
```

## 1. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# then edit .env: set DATABASE_URL, GOOGLE_API_KEY, HUGGINGFACE_TOKEN, JWT_SECRET_KEY
```

**PostgreSQL:** create a database matching `DATABASE_URL`, e.g.:

```bash
createdb meetmind_ai
```

Tables are auto-created on startup via `Base.metadata.create_all` for development.
For production, swap this for Alembic migrations.

**API keys you'll need:**
- `GOOGLE_API_KEY` — Google AI Studio key for Gemini (summaries, action items, Q&A, embeddings)
- `HUGGINGFACE_TOKEN` — HuggingFace token with access accepted for
  `pyannote/speaker-diarization-3.1` (used for speaker diarization)

**Run the API:**

```bash
uvicorn app.main:app --reload --port 8000
```

The API will be live at `http://localhost:8000`, docs at `http://localhost:8000/docs`.

> Note: `openai-whisper` and `pyannote.audio` are heavy ML dependencies (PyTorch-based).
> The first transcription/diarization call will download model weights, and a GPU is
> strongly recommended for reasonable processing speed — CPU works but is slow.

## 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173` and proxies `/api` requests to the backend
at `http://localhost:8000` (see `vite.config.ts`).

## How It Works

1. **Upload or record** — drag-and-drop a file, or record directly in the browser via
   the MediaRecorder API.
2. **Processing pipeline** (runs as a background task per meeting):
   - Whisper transcribes the audio into timestamped segments.
   - pyannote.audio performs speaker diarization; segments are merged with speaker
     labels by picking the highest-overlap speaker turn.
   - Gemini reads the full transcript and returns a structured summary, key points,
     and action items in one call.
   - LangChain splits the transcript into chunks, embeds them with Gemini embeddings,
     and stores them in a per-meeting ChromaDB collection.
3. **Meeting Detail page** polls the meeting status every few seconds while
   processing, then shows the Summary, Transcript (with renameable speakers),
   Action Items (with priority/assignee/completion), and an "Ask AI" chat tab
   that answers questions via retrieval over that meeting's transcript.

## Authentication

JWT access + refresh tokens. The frontend stores tokens in `localStorage` and an
Axios response interceptor automatically refreshes an expired access token and
retries the original request; a failed refresh redirects to `/login`.

## Notes & Next Steps for Production

- Swap `create_all` for Alembic migrations.
- Move file storage to S3/GCS instead of local disk.
- Move the processing pipeline from FastAPI `BackgroundTasks` to a real task queue
  (Celery, RQ, or Arq) with retries and a dedicated GPU worker.
- Add rate limiting and file-size/type validation hardening on upload.
- Add pagination to the meetings list endpoint.
- Consider streaming the chat responses (Server-Sent Events) for a snappier "Ask AI" UX.
