from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://meetmind:meetmind@localhost:5432/meetmind_ai"

    # Auth
    JWT_SECRET_KEY: str = "dev-secret-change-me"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # AI Providers
    GOOGLE_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    HUGGINGFACE_TOKEN: str = ""

    # Whisper
    WHISPER_MODEL_SIZE: str = "base"

    # Storage
    UPLOAD_DIR: str = "app/uploads"
    MAX_UPLOAD_SIZE_MB: int = 500

    # ChromaDB
    CHROMA_PERSIST_DIR: str = "app/chroma_store"

    # CORS
    FRONTEND_ORIGIN: str = "http://localhost:5173"

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
