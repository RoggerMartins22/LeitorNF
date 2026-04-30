from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    GEMINI_API_KEY: str
    DATABASE_URL: str = "postgresql://nf_user:nf_pass@db:5432/nf_db"

    class Config:
        env_file = ".env"


settings = Settings()
