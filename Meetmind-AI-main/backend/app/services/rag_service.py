"""
Retrieval-Augmented Generation over a meeting's transcript, using LangChain +
ChromaDB for vector storage/retrieval, a local HuggingFace embedding model
(no API needed), and Groq (free, no billing) for the chat answer.
"""
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.documents import Document
from groq import Groq

from app.config import settings

# Runs locally on your machine the first time it's used, downloads a small
# (~80MB) open embedding model. No API key or billing required.
_embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

_groq_client = Groq(api_key=settings.GROQ_API_KEY)
CHAT_MODEL = "llama-3.3-70b-versatile"


def _collection_name(meeting_id: str) -> str:
    return f"meeting_{meeting_id}"


def index_meeting_transcript(meeting_id: str, segments: list[dict]) -> None:
    """
    Splits the transcript into overlapping chunks (each tagged with speaker and
    timestamp metadata) and stores their embeddings in a per-meeting Chroma
    collection.

    segments: list of {"speaker": str, "start": float, "end": float, "text": str}
    """
    full_text_blocks = [
        f"[{seg['start']:.0f}s] {seg.get('speaker', 'Unknown')}: {seg['text']}"
        for seg in segments
    ]
    raw_text = "\n".join(full_text_blocks)

    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=150)
    chunks = splitter.split_text(raw_text)

    documents = [
        Document(page_content=chunk, metadata={"meeting_id": meeting_id})
        for chunk in chunks
    ]

    Chroma.from_documents(
        documents=documents,
        embedding=_embeddings,
        collection_name=_collection_name(meeting_id),
        persist_directory=settings.CHROMA_PERSIST_DIR,
    )


def ask_question(meeting_id: str, question: str) -> str:
    """
    Answers a natural-language question about a specific meeting by retrieving
    the most relevant transcript chunks and passing them to Groq as context.
    """
    vectordb = Chroma(
        collection_name=_collection_name(meeting_id),
        embedding_function=_embeddings,
        persist_directory=settings.CHROMA_PERSIST_DIR,
    )

    docs = vectordb.similarity_search(question, k=5)
    context = "\n\n".join(doc.page_content for doc in docs)

    prompt = f"""Answer the question using ONLY the meeting transcript excerpts below. \
If the answer isn't in the excerpts, say you couldn't find it in this meeting's transcript.

TRANSCRIPT EXCERPTS:
{context}

QUESTION: {question}
"""

    response = _groq_client.chat.completions.create(
        model=CHAT_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
    )

    return response.choices[0].message.content or "I couldn't find an answer in this meeting's transcript."