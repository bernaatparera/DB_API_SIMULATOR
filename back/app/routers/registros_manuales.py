from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from uuid import UUID

from app.database import get_db
from app.models import RegistroManual, Usuario
from app.schemas import RegistroManualCreate, RegistroManualRead
from app.security import get_current_user

router = APIRouter(prefix="/registros_manuales", tags=["registros_manuales"])


@router.get("/", response_model=list[RegistroManualRead], summary="Listar registros manuales")
def list_registros(
    casilla_id: int | None = Query(default=None, ge=1),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
) -> list[RegistroManual]:
    stmt = select(RegistroManual)
    if casilla_id is not None:
        stmt = stmt.where(RegistroManual.casilla_id == casilla_id)
    stmt = stmt.order_by(RegistroManual.dia_hora.desc()).offset(skip).limit(limit)
    return list(db.scalars(stmt).all())


@router.post("/", response_model=RegistroManualRead, status_code=201, summary="Crear registro manual")
def create_registro(
    payload: RegistroManualCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
) -> RegistroManual:
    registro = RegistroManual(
        **payload.model_dump(),
        usuario_id=current_user.id
    )
    db.add(registro)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="No se pudo crear el registro manual (verifica la casilla_id)")
    db.refresh(registro)
    return registro


@router.delete("/{registro_id}", status_code=204, summary="Eliminar registro manual")
def delete_registro(
    registro_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
) -> None:
    registro = db.get(RegistroManual, registro_id)
    if registro is None:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
        
    if registro.usuario_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tienes permiso para eliminar este registro")

    db.delete(registro)
    db.commit()
