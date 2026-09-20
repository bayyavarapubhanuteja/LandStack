from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BACKEND_DIR / ".env", extra="ignore")

    database_url: str = f"sqlite:///{BACKEND_DIR / 'landstack.db'}"
    jwt_secret: str = "dev-only-insecure-secret-change-me"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 480
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    auto_seed: bool = True

    def model_post_init(self, _ctx) -> None:
        # Render (and Heroku) hand out "postgres://…"; SQLAlchemy needs an explicit driver.
        if self.database_url.startswith("postgres://"):
            self.database_url = self.database_url.replace("postgres://", "postgresql+psycopg2://", 1)

    @property
    def is_postgres(self) -> bool:
        return self.database_url.startswith("postgresql")

    @property
    def cors_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
