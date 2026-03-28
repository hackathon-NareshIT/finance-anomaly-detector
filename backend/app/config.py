from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str                          
    SECRET_KEY: str = "changeme-use-a-long-random-string-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  

    @property
    def DATABASE_URL_FIXED(self) -> str:
        # Railway often provides URLs with 'postgres://', but SQLAlchemy 2.0+ requires 'postgresql://'
        if self.DATABASE_URL.startswith("postgres://"):
            return self.DATABASE_URL.replace("postgres://", "postgresql://", 1)
        return self.DATABASE_URL

    class Config:
        env_file = ".env"

settings = Settings()
