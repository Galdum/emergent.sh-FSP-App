from pydantic import BaseSettings, Field, validator
from typing import List, Optional
import os
from pathlib import Path


class Settings(BaseSettings):
    """Application settings with environment variable validation."""
    
    # Database Configuration
    mongo_url: str = Field(..., env="MONGO_URL")
    db_name: str = Field(..., env="DB_NAME")
    
    # Authentication
    jwt_secret_key: str = Field(..., env="JWT_SECRET_KEY")
    
    # Encryption
    encryption_key: str = Field(..., env="ENCRYPTION_KEY")
    
    # Environment
    environment: str = Field(default="production", env="ENVIRONMENT")
    
    # Redis Configuration
    redis_url: str = Field(default="redis://localhost:6379", env="REDIS_URL")
    redis_password: Optional[str] = Field(default=None, env="REDIS_PASSWORD")
    redis_db: int = Field(default=0, env="REDIS_DB")
    redis_max_connections: int = Field(default=10, env="REDIS_MAX_CONNECTIONS")
    
    # Rate Limiting
    rate_limit_default: str = Field(default="200 per day, 50 per hour", env="RATE_LIMIT_DEFAULT")
    rate_limit_login: str = Field(default="10 per minute", env="RATE_LIMIT_LOGIN")
    rate_limit_register: str = Field(default="5 per hour", env="RATE_LIMIT_REGISTER")
    rate_limit_upload: str = Field(default="20 per hour", env="RATE_LIMIT_UPLOAD")
    rate_limit_password_reset: str = Field(default="3 per hour", env="RATE_LIMIT_PASSWORD_RESET")
    
    # File Upload
    upload_dir: str = Field(default="/app/uploads", env="UPLOAD_DIR")
    max_file_size_mb: int = Field(default=10, env="MAX_FILE_SIZE_MB")
    allowed_file_types: str = Field(default="pdf,jpg,jpeg,png,doc,docx", env="ALLOWED_FILE_TYPES")
    
    # Security
    allowed_origins: str = Field(default="http://localhost:3000,http://localhost:8080", env="ALLOWED_ORIGINS")
    
    # Optional Services
    sentry_dsn: Optional[str] = Field(default=None, env="SENTRY_DSN")
    analytics_salt: Optional[str] = Field(default=None, env="ANALYTICS_SALT")
    
    @validator("jwt_secret_key")
    def validate_jwt_secret_key(cls, v):
        if len(v) < 32:
            raise ValueError("JWT_SECRET_KEY must be at least 32 characters long")
        return v
    
    @validator("encryption_key")
    def validate_encryption_key(cls, v):
        if len(v) < 32:
            raise ValueError("ENCRYPTION_KEY must be at least 32 characters long")
        return v
    
    @validator("mongo_url")
    def validate_mongo_url(cls, v):
        if not v.startswith(("mongodb://", "mongodb+srv://")):
            raise ValueError("MONGO_URL must be a valid MongoDB connection string")
        return v
    
    @property
    def allowed_origins_list(self) -> List[str]:
        """Convert comma-separated origins string to list."""
        return [origin.strip() for origin in self.allowed_origins.split(",")]
    
    @property
    def allowed_file_types_list(self) -> List[str]:
        """Convert comma-separated file types string to list."""
        return [ft.strip() for ft in self.allowed_file_types.split(",")]
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


# Create global settings instance
try:
    settings = Settings()
except Exception as e:
    print(f"❌ Failed to load settings: {e}")
    print("Please check your .env file and ensure all required variables are set.")
    raise


def get_settings() -> Settings:
    """Get the global settings instance."""
    return settings