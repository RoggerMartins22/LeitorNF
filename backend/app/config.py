from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    GEMINI_API_KEY: str
    DATABASE_URL: str = "postgresql://nf_user:nf_pass@db:5432/nf_db"
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    class Config:
        env_file = ".env"


settings = Settings()


def _validar_config():
    erros = []
    if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY.strip() == "":
        erros.append("GEMINI_API_KEY não configurada. Obtenha em https://aistudio.google.com/app/apikey e defina no .env (ou no painel da hospedagem).")
    if not settings.SECRET_KEY or settings.SECRET_KEY.strip() == "" or settings.SECRET_KEY == "gere_uma_chave_aleatoria_segura_aqui":
        erros.append("SECRET_KEY não configurada. Gere com: python -c \"import secrets; print(secrets.token_hex(32))\" e defina no .env.")
    if erros:
        raise RuntimeError("Configuração ausente:\n  - " + "\n  - ".join(erros))


_validar_config()
