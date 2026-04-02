from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Sensor
from app.schemas import SensorCreate, SensorRead

router = APIRouter(prefix="/sensores", tags=["sensores"])


@router.get("/", response_model=list[SensorRead], summary="Listar sensores")
def list_sensores(
    casilla_id: int | None = Query(default=None, ge=1),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
) -> list[Sensor]:
    stmt = select(Sensor)
    if casilla_id is not None:
        stmt = stmt.where(Sensor.casilla_id == casilla_id)
    stmt = stmt.offset(skip).limit(limit)
    return list(db.scalars(stmt).all())


@router.get("/{sensor_id}", response_model=SensorRead, summary="Obtener sensor por ID")
def get_sensor(sensor_id: int, db: Session = Depends(get_db)) -> Sensor:
    sensor = db.get(Sensor, sensor_id)
    if sensor is None:
        raise HTTPException(status_code=404, detail="Sensor no encontrado")
    return sensor


@router.post("/", response_model=SensorRead, status_code=201, summary="Crear sensor")
def create_sensor(payload: SensorCreate, db: Session = Depends(get_db)) -> Sensor:
    sensor = Sensor(**payload.model_dump())
    db.add(sensor)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="No se pudo crear el sensor")
    db.refresh(sensor)
    return sensor
