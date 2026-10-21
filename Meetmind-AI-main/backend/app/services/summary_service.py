"""
Summarization and action-item extraction powered by Groq (free, no billing
required) using an open Llama model via Groq's OpenAI-compatible API.
"""
import json

from groq import Groq

from app.config import settings

_client = Groq(api_key=settings.GROQ_API_KEY)

SUMMARY_MODEL = "llama-3.3-70b-versatile"

SUMMARY_PROMPT = """You are an expert meeting assistant. Read the meeting transcript below \
and produce a JSON object with exactly these keys:

- "summary": a concise 3-6 sentence overview of what the meeting covered and what was decided.
- "key_points": an array of 4-8 short bullet-point strings capturing the most important points.
- "action_items": an array of objects, each with:
    - "description": what needs to be done
    - "assignee": the person responsible, or null if unclear
    - "priority": one of "low", "medium", "high"

Return ONLY valid JSON, no markdown fences, no commentary.

TRANSCRIPT:
{transcript}
"""


def generate_meeting_intelligence(transcript_text: str) -> dict:
    """
    Calls Groq once to produce a summary, key points, and action items in a
    single structured response.
    """
    prompt = SUMMARY_PROMPT.format(transcript=transcript_text[:100_000])

    response = _client.chat.completions.create(
        model=SUMMARY_MODEL,
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        temperature=0.3,
    )

    raw_text = response.choices[0].message.content

    try:
        data = json.loads(raw_text)
    except (json.JSONDecodeError, TypeError):
        data = {"summary": raw_text or "", "key_points": [], "action_items": []}

    data.setdefault("summary", "")
    data.setdefault("key_points", [])
    data.setdefault("action_items", [])
    return data