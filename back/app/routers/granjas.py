from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Casilla, Granja, Medicion, Parcela, Sensor, TipoCultivo
from app.schemas import (
    GranjaCreate,
    GranjaDashboardCultivoRead,
    GranjaDashboardRead,
    GranjaDashboardResumenRead,
    GranjaDashboardSerieRead,
    GranjaRead,
    GranjaUpdate,
)

router = APIRouter(prefix="/granjas", tags=["granjas"])


def _normalize_variable_name(value: str) -> str:
    return "".join(char for char in value.lower() if char.isalnum())


def _is_humidity_variable(variable: str) -> bool:
    normalized = _normalize_variable_name(variable)
    return "humedad" in normalized or "humidity" in normalized or "moisture" in normalized


def _is_temperature_variable(variable: str) -> bool:
    normalized = _normalize_variable_name(variable)
    return "temperatura" in normalized or normalized == "temp" or "temperature" in normalized


@router.get("/", response_model=list[GranjaRead], summary="Listar granjas")
def list_granjas(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[Granja]:
    stmt = select(Granja).offset(skip).limit(limit)
    return list(db.scalars(stmt).all())


@router.get("/{granja_id}", response_model=GranjaRead, summary="Obtener granja por ID")
def get_granja(granja_id: int, db: Session = Depends(get_db)) -> Granja:
    granja = db.get(Granja, granja_id)
    if granja is None:
        raise HTTPException(status_code=404, detail="Granja no encontrada")
    return granja


@router.get("/{granja_id}/dashboard", response_model=GranjaDashboardRead, summary="Dashboard agregado de granja")
def get_granja_dashboard(granja_id: int, db: Session = Depends(get_db)) -> GranjaDashboardRead:
    granja = db.get(Granja, granja_id)
    if granja is None:
        raise HTTPException(status_code=404, detail="Granja no encontrada")

    parcelas = db.execute(
        select(Parcela.id, Parcela.tamx, Parcela.tamy).where(Parcela.granja_id == granja_id)
    ).all()
    parcelas_count = len(parcelas)
    area_total = sum((row.tamx or 0) * (row.tamy or 0) for row in parcelas)

    sensores_count = db.execute(
        select(func.count(Sensor.id))
        .select_from(Sensor)
        .join(Casilla, Sensor.casilla_id == Casilla.id)
        .join(Parcela, Casilla.parcela_id == Parcela.id)
        .where(Parcela.granja_id == granja_id)
    ).scalar_one()

    mediciones_rows = db.execute(
        select(Medicion.variable, Medicion.valor, Medicion.dia_hora)
        .select_from(Medicion)
        .join(Sensor, Medicion.sensor_id == Sensor.id)
        .join(Casilla, Sensor.casilla_id == Casilla.id)
        .join(Parcela, Casilla.parcela_id == Parcela.id)
        .where(Parcela.granja_id == granja_id)
        .order_by(Medicion.dia_hora.asc())
    ).all()

    humedad_values: list[float] = []
    temperatura_values: list[float] = []
    latest_measurement = mediciones_rows[-1].dia_hora if mediciones_rows else None
    buckets: dict[str, dict[str, object]] = defaultdict(
        lambda: {
            "etiqueta": "",
            "humedad_values": [],
            "temperatura_values": [],
            "mediciones_count": 0,
        }
    )

    for row in mediciones_rows:
        variable = row.variable or ""
        value = float(row.valor)
        bucket_key = row.dia_hora.strftime("%Y-%m-%d")
        bucket = buckets[bucket_key]
        bucket["etiqueta"] = row.dia_hora.strftime("%d/%m")
        bucket["mediciones_count"] = int(bucket["mediciones_count"]) + 1

        if _is_humidity_variable(variable):
            humedad_values.append(value)
            bucket["humedad_values"].append(value)

        if _is_temperature_variable(variable):
            temperatura_values.append(value)
            bucket["temperatura_values"].append(value)

    def _media(values: list[float]) -> float | None:
        if not values:
            return None
        return round(sum(values) / len(values), 2)

    series = [
        GranjaDashboardSerieRead(
            etiqueta=str(bucket["etiqueta"]),
            humedad_media=_media(bucket["humedad_values"]),
            temperatura_media=_media(bucket["temperatura_values"]),
            mediciones_count=int(bucket["mediciones_count"]),
        )
        for _, bucket in sorted(buckets.items())
    ][-14:]

    distribucion_cultivos_rows = db.execute(
        select(
            func.coalesce(TipoCultivo.nombre, "Sin cultivo").label("nombre"),
            func.count(Parcela.id).label("parcelas_count"),
        )
        .select_from(Parcela)
        .outerjoin(TipoCultivo, TipoCultivo.id == Parcela.tipo_cultivo_id)
        .where(Parcela.granja_id == granja_id)
        .group_by(TipoCultivo.nombre)
        .order_by(func.count(Parcela.id).desc(), func.coalesce(TipoCultivo.nombre, "Sin cultivo"))
    ).all()

    distribucion_cultivos = [
        GranjaDashboardCultivoRead(nombre=row.nombre, parcelas_count=row.parcelas_count)
        for row in distribucion_cultivos_rows
    ]

    return GranjaDashboardRead(
        resumen=GranjaDashboardResumenRead(
            parcelas_count=parcelas_count,
            sensores_count=sensores_count,
            mediciones_count=len(mediciones_rows),
            area_total=area_total,
            humedad_media=_media(humedad_values),
            temperatura_media=_media(temperatura_values),
            ultima_medicion=latest_measurement,
        ),
        series=series,
        distribucion_cultivos=distribucion_cultivos,
    )


@router.post("/", response_model=GranjaRead, status_code=201, summary="Crear granja")
def create_granja(payload: GranjaCreate, db: Session = Depends(get_db)) -> Granja:
    granja = Granja(**payload.model_dump())
    db.add(granja)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="No se pudo crear la granja")
    db.refresh(granja)
    return granja


@router.put("/{granja_id}", response_model=GranjaRead, summary="Actualizar granja")
def update_granja(granja_id: int, payload: GranjaCreate, db: Session = Depends(get_db)) -> Granja:
    granja = db.get(Granja, granja_id)
    if granja is None:
        raise HTTPException(status_code=404, detail="Granja no encontrada")

    for key, value in payload.model_dump().items():
        setattr(granja, key, value)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="No se pudo actualizar la granja")
    db.refresh(granja)
    return granja


@router.patch("/{granja_id}", response_model=GranjaRead, summary="Actualizar parcialmente granja")
def patch_granja(granja_id: int, payload: GranjaUpdate, db: Session = Depends(get_db)) -> Granja:
    granja = db.get(Granja, granja_id)
    if granja is None:
        raise HTTPException(status_code=404, detail="Granja no encontrada")

    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No se enviaron campos para actualizar")

    for key, value in updates.items():
        setattr(granja, key, value)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="No se pudo actualizar la granja")
    db.refresh(granja)
    return granja


@router.delete("/{granja_id}", status_code=204, summary="Eliminar granja")
def delete_granja(granja_id: int, db: Session = Depends(get_db)) -> None:
    granja = db.get(Granja, granja_id)
    if granja is None:
        raise HTTPException(status_code=404, detail="Granja no encontrada")

    db.delete(granja)
    db.commit()
