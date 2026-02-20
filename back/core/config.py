from typing import Optional, List
from pydantic_settings import BaseSettings
from pydantic import EmailStr, PostgresDsn, validator


class Settings(BaseSettings):
    # App
    APP_NAME: str = "ArmPCB"
    APP_ENV: str = "development"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Database
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: str = "5432"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = ""
    POSTGRES_DB: str = "armpcb"
    DATABASE_URL: Optional[PostgresDsn] = None
    
    @validator("DATABASE_URL", pre=True)
    def assemble_db_connection(cls, v: Optional[str], values: dict) -> str:
        if isinstance(v, str):
            return v
        return PostgresDsn.build(
            scheme="postgresql+asyncpg",
            username=values.get("POSTGRES_USER"),
            password=values.get("POSTGRES_PASSWORD"),
            host=values.get("POSTGRES_SERVER"),
            port=int(values.get("POSTGRES_PORT")),
            path=f"{values.get('POSTGRES_DB') or ''}",
        )
    
    # JWT
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # OTP
    OTP_ENABLED: bool = False
    OTP_TTL_MINUTES: int = 10
    OTP_MAX_ATTEMPTS: int = 5
    OTP_RESEND_COOLDOWN_SECONDS: int = 60
    OTP_MAX_SENDS: int = 3
    OTP_PEPPER: str = ""
    
    # SMTP
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASS: Optional[str] = None
    SMTP_FROM: Optional[EmailStr] = None
    SMTP_STARTTLS: bool = True
    SMTP_INSECURE_SKIP_VERIFY: bool = False
    
    # S3 / MinIO
    S3_ENDPOINT: Optional[str] = None
    S3_ACCESS_KEY: Optional[str] = None
    S3_SECRET_KEY: Optional[str] = None
    S3_BUCKET: str = "armpcb-files"
    S3_REGION: str = "us-east-1"
    S3_USE_SSL: bool = True
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]
    
    # PCB Calculator Defaults
    ENGINEERING_FEE: float = 50.0
    MATERIAL_RATE: float = 0.5
    LAYER_MULTI_4: float = 1.5
    LAYER_MULTI_6: float = 2.0
    URGENT_MULTI: float = 2.5
    COLOR_FEE_BLACK: float = 10.0
    COLOR_FEE_RED: float = 10.0
    COLOR_FEE_BLUE: float = 10.0
    COLOR_FEE_WHITE: float = 15.0
    COLOR_FEE_YELLOW: float = 20.0
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()