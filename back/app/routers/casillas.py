from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Casilla
from app.schemas import CasillaCreate, CasillaRead

router = APIRouter(prefix="/casillas", tags=["casillas"])


@router.get("/", response_model=list[CasillaRead], summary="Listar casillas")
def list_casillas(
    parcela_id: int | None = Query(default=None, ge=1),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
) -> list[Casilla]:
    stmt = select(Casilla)
    if parcela_id is not None:
        stmt = stmt.where(Casilla.parcela_id == parcela_id)
    stmt = stmt.offset(skip).limit(limit)
    return list(db.scalars(stmt).all())


@router.get("/{casilla_id}", response_model=CasillaRead, summary="Obtener casilla por ID")
def get_casilla(casilla_id: int, db: Session = Depends(get_db)) -> Casilla:
    casilla = db.get(Casilla, casilla_id)
    if casilla is None:
        raise HTTPException(status_code=404, detail="Casilla no encontrada")
    return casilla


@router.post("/", response_model=CasillaRead, status_code=201, summary="Crear casilla")
def create_casilla(payload: CasillaCreate, db: Session = Depends(get_db)) -> Casilla:
    casilla = Casilla(**payload.model_dump())
    db.add(casilla)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="No se pudo crear la casilla")
    db.refresh(casilla)
    return casilla
