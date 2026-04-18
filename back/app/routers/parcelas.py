from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Casilla, Medicion, Parcela, Sensor, TipoCultivo
from app.schemas import (
    ParcelaCreate,
    ParcelaListRead,
    ParcelaMedicionPage,
    ParcelaMedicionRead,
    ParcelaRead,
    ParcelaUpdate,
)

router = APIRouter(prefix="/parcelas", tags=["parcelas"])


@router.get("/", response_model=list[ParcelaListRead], summary="Listar parcelas")
def list_parcelas(
    granja_id: int | None = Query(default=None, ge=1),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[ParcelaListRead]:
    sensores_count = func.count(Sensor.id)
    stmt = (
        select(
            Parcela.id,
            Parcela.granja_id,
            Parcela.tipo_cultivo_id,
            Parcela.nombre,
            Parcela.tamx,
            Parcela.tamy,
            Parcela.creado_en,
            TipoCultivo.nombre.label("tipo_cultivo_nombre"),
            sensores_count.label("sensores_count"),
        )
        .outerjoin(Casilla, Casilla.parcela_id == Parcela.id)
        .outerjoin(Sensor, Sensor.casilla_id == Casilla.id)
        .outerjoin(TipoCultivo, TipoCultivo.id == Parcela.tipo_cultivo_id)
        .group_by(
            Parcela.id,
            Parcela.granja_id,
            Parcela.tipo_cultivo_id,
            Parcela.nombre,
            Parcela.tamx,
            Parcela.tamy,
            Parcela.creado_en,
            TipoCultivo.nombre,
        )
    )
    if granja_id is not None:
        stmt = stmt.where(Parcela.granja_id == granja_id)
    rows = db.execute(stmt.offset(skip).limit(limit)).all()
    return [
        ParcelaListRead(
            id=row.id,
            granja_id=row.granja_id,
            tipo_cultivo_id=row.tipo_cultivo_id,
            nombre=row.nombre,
            tamx=row.tamx,
            tamy=row.tamy,
            creado_en=row.creado_en,
            sensores_count=row.sensores_count,
            tipo_cultivo_nombre=row.tipo_cultivo_nombre,
        )
        for row in rows
    ]


@router.get("/{parcela_id}", response_model=ParcelaRead, summary="Obtener parcela por ID")
def get_parcela(parcela_id: int, db: Session = Depends(get_db)) -> Parcela:
    parcela = db.get(Parcela, parcela_id)
    if parcela is None:
        raise HTTPException(status_code=404, detail="Parcela no encontrada")
    return parcela


@router.post("/", response_model=ParcelaRead, status_code=201, summary="Crear parcela")
def create_parcela(payload: ParcelaCreate, db: Session = Depends(get_db)) -> Parcela:
    if payload.tipo_cultivo_id is not None:
        tipo_cultivo = db.get(TipoCultivo, payload.tipo_cultivo_id)
        if tipo_cultivo is None:
            raise HTTPException(status_code=400, detail="Tipo de cultivo no encontrado")
        if tipo_cultivo.granja_id != payload.granja_id:
            raise HTTPException(status_code=400, detail="El tipo de cultivo no pertenece a la granja")

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

    if payload.tipo_cultivo_id is not None:
        tipo_cultivo = db.get(TipoCultivo, payload.tipo_cultivo_id)
        if tipo_cultivo is None:
            raise HTTPException(status_code=400, detail="Tipo de cultivo no encontrado")
        if tipo_cultivo.granja_id != payload.granja_id:
            raise HTTPException(status_code=400, detail="El tipo de cultivo no pertenece a la granja")

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

    new_granja_id = updates.get("granja_id", parcela.granja_id)
    if "tipo_cultivo_id" in updates and updates["tipo_cultivo_id"] is not None:
        tipo_cultivo = db.get(TipoCultivo, updates["tipo_cultivo_id"])
        if tipo_cultivo is None:
            raise HTTPException(status_code=400, detail="Tipo de cultivo no encontrado")
        if tipo_cultivo.granja_id != new_granja_id:
            raise HTTPException(status_code=400, detail="El tipo de cultivo no pertenece a la granja")

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
