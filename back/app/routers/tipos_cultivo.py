from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import TipoCultivo
from app.schemas import TipoCultivoCreate, TipoCultivoRead, TipoCultivoUpdate

router = APIRouter(prefix="/tipos-cultivo", tags=["tipos-cultivo"])


@router.get("/", response_model=list[TipoCultivoRead], summary="Listar tipos de cultivo")
def list_tipos_cultivo(
    granja_id: int | None = Query(default=None, ge=1),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[TipoCultivo]:
    stmt = select(TipoCultivo)
    if granja_id is not None:
        stmt = stmt.where(TipoCultivo.granja_id == granja_id)
    stmt = stmt.offset(skip).limit(limit)
    return list(db.scalars(stmt).all())


@router.get("/{tipo_cultivo_id}", response_model=TipoCultivoRead, summary="Obtener tipo de cultivo por ID")
def get_tipo_cultivo(tipo_cultivo_id: int, db: Session = Depends(get_db)) -> TipoCultivo:
    tipo = db.get(TipoCultivo, tipo_cultivo_id)
    if tipo is None:
        raise HTTPException(status_code=404, detail="Tipo de cultivo no encontrado")
    return tipo


@router.post("/", response_model=TipoCultivoRead, status_code=201, summary="Crear tipo de cultivo")
def create_tipo_cultivo(payload: TipoCultivoCreate, db: Session = Depends(get_db)) -> TipoCultivo:
    tipo = TipoCultivo(**payload.model_dump())
    db.add(tipo)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="No se pudo crear el tipo de cultivo")
    db.refresh(tipo)
    return tipo


@router.put("/{tipo_cultivo_id}", response_model=TipoCultivoRead, summary="Actualizar tipo de cultivo")
def update_tipo_cultivo(tipo_cultivo_id: int, payload: TipoCultivoCreate, db: Session = Depends(get_db)) -> TipoCultivo:
    tipo = db.get(TipoCultivo, tipo_cultivo_id)
    if tipo is None:
        raise HTTPException(status_code=404, detail="Tipo de cultivo no encontrado")

    for key, value in payload.model_dump().items():
        setattr(tipo, key, value)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="No se pudo actualizar el tipo de cultivo")
    db.refresh(tipo)
    return tipo


@router.patch("/{tipo_cultivo_id}", response_model=TipoCultivoRead, summary="Actualizar parcialmente tipo de cultivo")
def patch_tipo_cultivo(tipo_cultivo_id: int, payload: TipoCultivoUpdate, db: Session = Depends(get_db)) -> TipoCultivo:
    tipo = db.get(TipoCultivo, tipo_cultivo_id)
    if tipo is None:
        raise HTTPException(status_code=404, detail="Tipo de cultivo no encontrado")

    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No se enviaron campos para actualizar")

    for key, value in updates.items():
        setattr(tipo, key, value)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="No se pudo actualizar el tipo de cultivo")
    db.refresh(tipo)
    return tipo


@router.delete("/{tipo_cultivo_id}", status_code=204, summary="Eliminar tipo de cultivo")
def delete_tipo_cultivo(tipo_cultivo_id: int, db: Session = Depends(get_db)) -> None:
    tipo = db.get(TipoCultivo, tipo_cultivo_id)
    if tipo is None:
        raise HTTPException(status_code=404, detail="Tipo de cultivo no encontrado")

    db.delete(tipo)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="No se pudo eliminar el tipo de cultivo")
