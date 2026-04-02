from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Parcela
from app.schemas import ParcelaCreate, ParcelaRead

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
