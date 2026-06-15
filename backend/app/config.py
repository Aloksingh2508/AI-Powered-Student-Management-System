import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load from .env file if it exists
load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "EduMind AI - Student Result Management Platform"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./student_results.db")
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "super_secret_key_change_me_in_production_123456")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    
    # AI Keys
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")

    class Config:
        case_sensitive = True

settings = Settings()
