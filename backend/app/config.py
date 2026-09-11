import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    PRIMARY_LLM: str = os.getenv("PRIMARY_LLM", "openai/gpt-oss-20b")
    SECONDARY_LLM: str = os.getenv("SECONDARY_LLM", "openai/gpt-oss-120b")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./aivoa_qms.db")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    PORT: int = int(os.getenv("PORT", "8000"))
    ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000")

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
