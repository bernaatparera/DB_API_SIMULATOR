from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Usuario
from app.schemas import UsuarioCreate, UsuarioRead
from app.security import get_current_user, get_password_hash

router = APIRouter(prefix="/usuarios", tags=["usuarios"])


@router.get("/", response_model=list[UsuarioRead], summary="Listar usuarios")
def list_usuarios(
    activo: bool | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    _: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Usuario]:
    stmt = select(Usuario)
    if activo is not None:
        stmt = stmt.where(Usuario.activo == activo)
    stmt = stmt.offset(skip).limit(limit)
    return list(db.scalars(stmt).all())


@router.get("/{usuario_id}", response_model=UsuarioRead, summary="Obtener usuario por ID")
def get_usuario(
    usuario_id: str,
    _: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Usuario:
    usuario = db.get(Usuario, usuario_id)
    if usuario is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return usuario


@router.post("/", response_model=UsuarioRead, status_code=201, summary="Crear usuario")
def create_usuario(payload: UsuarioCreate, db: Session = Depends(get_db)) -> Usuario:
    data = payload.model_dump()
    data["hash_contrasena"] = get_password_hash(payload.hash_contrasena)
    usuario = Usuario(**data)
    db.add(usuario)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="No se pudo crear el usuario")
    db.refresh(usuario)
    return usuario
