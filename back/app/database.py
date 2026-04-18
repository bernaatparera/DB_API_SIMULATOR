from collections.abc import Generator

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, declarative_base, sessionmaker

from app.config import get_settings

settings = get_settings()

engine = create_engine(settings.sqlalchemy_database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def _ensure_parcela_columns() -> None:
    """Compatibilidad: añade columnas nuevas de parcela en BDs existentes."""
    with engine.begin() as conn:
        conn.execute(
            text(
                """
                ALTER TABLE parcela
                ADD COLUMN IF NOT EXISTS tipo_cultivo_id INTEGER
                """
            )
        )
        conn.execute(
            text(
                """
                ALTER TABLE parcela
                ADD COLUMN IF NOT EXISTS creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
                """
            )
        )


_ensure_parcela_columns()


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
