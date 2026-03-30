from fastapi import APIRouter
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db
from fastapi import Depends

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/live", summary="Liveness probe")
def live() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/ready", summary="Readiness probe con DB")
def ready(db: Session = Depends(get_db)) -> dict[str, str]:
    db.execute(text("SELECT 1"))
    return {"status": "ready"}
