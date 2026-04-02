from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Granja
from app.schemas import GranjaCreate, GranjaRead

router = APIRouter(prefix="/granjas", tags=["granjas"])


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
