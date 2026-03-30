from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Medicion
from app.schemas import MedicionCreate, MedicionRead

router = APIRouter(prefix="/mediciones", tags=["mediciones"])


@router.get("/", response_model=list[MedicionRead], summary="Listar mediciones")
def list_mediciones(
    sensor_id: int | None = Query(default=None, ge=1),
    desde: datetime | None = None,
    hasta: datetime | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=2000),
    db: Session = Depends(get_db),
) -> list[Medicion]:
    stmt = select(Medicion)
    if sensor_id is not None:
        stmt = stmt.where(Medicion.sensor_id == sensor_id)
    if desde is not None:
        stmt = stmt.where(Medicion.dia_hora >= desde)
    if hasta is not None:
        stmt = stmt.where(Medicion.dia_hora <= hasta)

    stmt = stmt.order_by(Medicion.dia_hora.desc()).offset(skip).limit(limit)
    return list(db.scalars(stmt).all())


@router.get("/{medicion_id}", response_model=MedicionRead, summary="Obtener medicion por ID")
def get_medicion(medicion_id: int, db: Session = Depends(get_db)) -> Medicion:
    medicion = db.get(Medicion, medicion_id)
    if medicion is None:
        raise HTTPException(status_code=404, detail="Medicion no encontrada")
    return medicion


@router.post("/", response_model=MedicionRead, status_code=201, summary="Crear medicion")
def create_medicion(payload: MedicionCreate, db: Session = Depends(get_db)) -> Medicion:
    data = payload.model_dump(exclude_none=True)
    medicion = Medicion(**data)
    db.add(medicion)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="No se pudo crear la medicion")
    db.refresh(medicion)
    return medicion
