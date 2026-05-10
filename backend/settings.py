from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    # Gemini AI Config
    gemini_api_key: str
    gemini_model: str = "gemini-1.5-flash-latest"

    # Supabase Config (Backend might need these if interacting directly)
    supabase_url: Optional[str] = None
    supabase_service_role_key: Optional[str] = None

    # App Config
    debug: bool = False
    port: int = 8000

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
