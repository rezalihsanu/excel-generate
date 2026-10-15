import os
from pathlib import Path
from typing import Any
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

# Explicitly load .env from backend root directory
ENV_FILE = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=ENV_FILE, override=True)

class Settings(BaseSettings):
    PROJECT_NAME: str = "Excel Insight API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Supabase Configuration
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "http://127.0.0.1:54321")
    SUPABASE_PUBLISHABLE_KEY: str = os.getenv("SUPABASE_PUBLISHABLE_KEY", "")
    SUPABASE_SECRET_KEY: str = os.getenv("SUPABASE_SECRET_KEY", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "super-secret-jwt-token-with-at-least-32-characters-long")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@127.0.0.1:54322/postgres")
    
    # Storage Buckets
    SUPABASE_STORAGE_BUCKET_EXCEL: str = os.getenv("SUPABASE_STORAGE_BUCKET_EXCEL", "excel-uploads")
    SUPABASE_STORAGE_BUCKET_PDF: str = os.getenv("SUPABASE_STORAGE_BUCKET_PDF", "pdf-reports")
    
    # Constraints
    MAX_FILE_SIZE_BYTES: int = 50 * 1024 * 1024 # 50 MB
    ALLOWED_ORIGINS: Any = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
    
    # Temp local directory for file streaming / chart cache
    STORAGE_LOCAL_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "storage")

    class Config:
        env_file = str(ENV_FILE)
        extra = "allow"

settings = Settings()
os.makedirs(settings.STORAGE_LOCAL_DIR, exist_ok=True)
