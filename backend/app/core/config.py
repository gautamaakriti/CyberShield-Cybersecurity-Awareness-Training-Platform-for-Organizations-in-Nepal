from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/cybersec_training"
    SECRET_KEY: str = "supersecretkey123changeinproduction"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    FRONTEND_URL: str = "http://localhost:5173"
    ADMIN_EMAIL: str = "gautamaakriti404@gmail.com"
    ADMIN_PASSWORD: str = "Admin@123"
    ADMIN_NAME: str = "Super Admin"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
