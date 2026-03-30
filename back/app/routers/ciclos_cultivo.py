from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import CicloCultivo
from app.schemas import CicloCultivoCreate, CicloCultivoRead

router = APIRouter(prefix="/ciclos-cultivo", tags=["ciclos-cultivo"])


@router.get("/", response_model=list[CicloCultivoRead], summary="Listar ciclos de cultivo")
def list_ciclos(
    casilla_id: int | None = Query(default=None, ge=1),
    tipo_cultivo_id: int | None = Query(default=None, ge=1),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
) -> list[CicloCultivo]:
    stmt = select(CicloCultivo)
    if casilla_id is not None:
        stmt = stmt.where(CicloCultivo.casilla_id == casilla_id)
    if tipo_cultivo_id is not None:
        stmt = stmt.where(CicloCultivo.tipo_cultivo_id == tipo_cultivo_id)
    stmt = stmt.offset(skip).limit(limit)
    return list(db.scalars(stmt).all())


@router.get("/{ciclo_id}", response_model=CicloCultivoRead, summary="Obtener ciclo de cultivo por ID")
def get_ciclo(ciclo_id: int, db: Session = Depends(get_db)) -> CicloCultivo:
    ciclo = db.get(CicloCultivo, ciclo_id)
    if ciclo is None:
        raise HTTPException(status_code=404, detail="Ciclo de cultivo no encontrado")
    return ciclo


@router.post("/", response_model=CicloCultivoRead, status_code=201, summary="Crear ciclo de cultivo")
def create_ciclo(payload: CicloCultivoCreate, db: Session = Depends(get_db)) -> CicloCultivo:
    ciclo = CicloCultivo(**payload.model_dump(exclude_none=True))
    db.add(ciclo)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="No se pudo crear el ciclo de cultivo")
    db.refresh(ciclo)
    return ciclo
