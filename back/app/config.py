from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    api_title: str = "AgroPrecision API"
    api_version: str = "0.1.0"
    api_description: str = "API REST para gestionar granjas, parcelas, casillas, sensores y mediciones."

    db_host: str = "127.0.0.1"
    db_port: int = 5433
    db_name: str = "agroprecision"
    db_user: str = "agro_user"
    db_password: str = "agro_pass"
    database_url: str | None = None

    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    jwt_secret_key: str = "change-this-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    @property
    def sqlalchemy_database_url(self) -> str:
        if self.database_url:
            return self.database_url
        return (
            f"postgresql+psycopg2://{self.db_user}:{self.db_password}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}"
        )

    def parsed_cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
