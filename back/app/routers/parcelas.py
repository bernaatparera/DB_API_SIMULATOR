from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Casilla, Medicion, Parcela, Sensor
from app.schemas import (
    ParcelaCreate,
    ParcelaMedicionPage,
    ParcelaMedicionRead,
    ParcelaRead,
    ParcelaUpdate,
)

router = APIRouter(prefix="/parcelas", tags=["parcelas"])


@router.get("/", response_model=list[ParcelaRead], summary="Listar parcelas")
def list_parcelas(
    granja_id: int | None = Query(default=None, ge=1),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[Parcela]:
    stmt = select(Parcela)
    if granja_id is not None:
        stmt = stmt.where(Parcela.granja_id == granja_id)
    stmt = stmt.offset(skip).limit(limit)
    return list(db.scalars(stmt).all())


@router.get("/{parcela_id}", response_model=ParcelaRead, summary="Obtener parcela por ID")
def get_parcela(parcela_id: int, db: Session = Depends(get_db)) -> Parcela:
    parcela = db.get(Parcela, parcela_id)
    if parcela is None:
        raise HTTPException(status_code=404, detail="Parcela no encontrada")
    return parcela


@router.post("/", response_model=ParcelaRead, status_code=201, summary="Crear parcela")
def create_parcela(payload: ParcelaCreate, db: Session = Depends(get_db)) -> Parcela:
    parcela = Parcela(**payload.model_dump())
    db.add(parcela)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="No se pudo crear la parcela")
    db.refresh(parcela)
    return parcela


@router.put("/{parcela_id}", response_model=ParcelaRead, summary="Actualizar parcela")
def update_parcela(parcela_id: int, payload: ParcelaCreate, db: Session = Depends(get_db)) -> Parcela:
    parcela = db.get(Parcela, parcela_id)
    if parcela is None:
        raise HTTPException(status_code=404, detail="Parcela no encontrada")

    for key, value in payload.model_dump().items():
        setattr(parcela, key, value)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="No se pudo actualizar la parcela")
    db.refresh(parcela)
    return parcela


@router.patch("/{parcela_id}", response_model=ParcelaRead, summary="Actualizar parcialmente parcela")
def patch_parcela(parcela_id: int, payload: ParcelaUpdate, db: Session = Depends(get_db)) -> Parcela:
    parcela = db.get(Parcela, parcela_id)
    if parcela is None:
        raise HTTPException(status_code=404, detail="Parcela no encontrada")

    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No se enviaron campos para actualizar")

    for key, value in updates.items():
        setattr(parcela, key, value)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="No se pudo actualizar la parcela")
    db.refresh(parcela)
    return parcela


@router.delete("/{parcela_id}", status_code=204, summary="Eliminar parcela")
def delete_parcela(parcela_id: int, db: Session = Depends(get_db)) -> None:
    parcela = db.get(Parcela, parcela_id)
    if parcela is None:
        raise HTTPException(status_code=404, detail="Parcela no encontrada")

    db.delete(parcela)
    db.commit()


@router.get("/{parcela_id}/mediciones", response_model=ParcelaMedicionPage, summary="Historial de sensores por parcela")
def get_parcela_mediciones(
    parcela_id: int,
    limit: int = Query(100, ge=1, le=2000),
    offset: int | None = Query(default=None, ge=0),
    page: int | None = Query(default=None, ge=1),
    fecha_inicio: datetime | None = Query(default=None),
    fecha_fin: datetime | None = Query(default=None),
    db: Session = Depends(get_db),
) -> ParcelaMedicionPage:
    parcela = db.get(Parcela, parcela_id)
    if parcela is None:
        raise HTTPException(status_code=404, detail="Parcela no encontrada")

    if fecha_inicio and fecha_fin and fecha_inicio > fecha_fin:
        raise HTTPException(status_code=400, detail="fecha_inicio no puede ser mayor que fecha_fin")

    if offset is not None and page is not None:
        raise HTTPException(status_code=400, detail="Use solo uno: offset o page")

    effective_offset = offset if offset is not None else ((page - 1) * limit if page is not None else 0)

    base_stmt = (
        select(Medicion.id, Medicion.sensor_id, Sensor.casilla_id, Medicion.variable, Medicion.valor, Medicion.dia_hora)
        .join(Sensor, Medicion.sensor_id == Sensor.id)
        .join(Casilla, Sensor.casilla_id == Casilla.id)
        .where(Casilla.parcela_id == parcela_id)
    )
    if fecha_inicio is not None:
        base_stmt = base_stmt.where(Medicion.dia_hora >= fecha_inicio)
    if fecha_fin is not None:
        base_stmt = base_stmt.where(Medicion.dia_hora <= fecha_fin)

    count_stmt = select(func.count()).select_from(base_stmt.subquery())
    total = db.execute(count_stmt).scalar_one()

    rows = db.execute(base_stmt.order_by(Medicion.dia_hora.desc()).offset(effective_offset).limit(limit)).all()
    items = [
        ParcelaMedicionRead(
            id=row.id,
            sensor_id=row.sensor_id,
            casilla_id=row.casilla_id,
            variable=row.variable,
            valor=float(row.valor),
            dia_hora=row.dia_hora,
        )
        for row in rows
    ]

    return ParcelaMedicionPage(total=total, limit=limit, offset=effective_offset, page=page, items=items)
