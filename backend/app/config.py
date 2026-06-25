from typing import Optional
from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

class DatabaseSettings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./kaizenova.db"
    
    @property
    def async_url(self) -> str:
        url = self.DATABASE_URL
        # Remove query parameters that cause issues with asyncpg (like pgbouncer=true)
        if "?" in url and ("postgresql" in url or "postgres" in url):
            url = url.split("?")[0]
            
        # Transform sync PostgreSQL URLs to asyncpg driver
        if url.startswith("postgresql://"):
            return url.replace("postgresql://", "postgresql+asyncpg://", 1)
        if url.startswith("postgres://"):
            return url.replace("postgres://", "postgresql+asyncpg://", 1)
        # SQLite: use aiosqlite driver
        if url.startswith("sqlite:///"):
            return url.replace("sqlite:///", "sqlite+aiosqlite:///", 1)
        # Already has a driver prefix — return as-is
        return url

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

class RedisSettings(BaseSettings):
    REDIS_URL: str
    
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

class SecuritySettings(BaseSettings):
    SECRET_KEY: SecretStr
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

class AISettings(BaseSettings):
    GROQ_API_KEY: SecretStr = Field(default="", description="Groq API key for LLM inference")
    SARVAM_API_KEY: SecretStr = Field(default="", description="Sarvam API key for LLM inference")
    GROQ_MODEL: str = Field(default="llama3-70b-8192", description="Groq model to use")
    OLLAMA_BASE_URL: str = Field(default="http://localhost:11434")
    WHISPER_MODEL: str = "large-v3"
    LANGUAGETOOL_URL: str = Field(default="http://localhost:8010/v2/check")
    
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

class EmailSettings(BaseSettings):
    RESEND_API_KEY: SecretStr
    EMAILS_FROM_EMAIL: str
    
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

class AppSettings(BaseSettings):
    PROJECT_NAME: str = "Kaizenova Backend"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = Field(default="development", env="ENVIRONMENT")
    
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

class Config:
    app = AppSettings()
    db = DatabaseSettings()
    redis = RedisSettings()
    security = SecuritySettings()
    ai = AISettings()
    email = EmailSettings()

settings = Config()
