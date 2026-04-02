from typing import Annotated

from fastapi import APIRouter, Depends, Form, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Usuario
from app.schemas import AuthUser, RegisterRequest, Token
from app.security import create_access_token, get_current_user, get_password_hash, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


class UsernamePasswordForm:
    def __init__(
        self,
        username: Annotated[str, Form(...)],
        password: Annotated[str, Form(...)],
    ) -> None:
        self.username = username
        self.password = password


@router.post("/register", response_model=AuthUser, status_code=201, summary="Registro de usuario")
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> AuthUser:
    existing = db.scalars(select(Usuario).where(Usuario.email == payload.username)).first()
    if existing is not None:
        raise HTTPException(status_code=409, detail="El usuario ya existe")

    user = Usuario(
        email=payload.username,
        hash_contrasena=get_password_hash(payload.password),
        nombre=payload.nombre,
        apellidos=payload.apellidos,
        activo=True,
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="No se pudo registrar el usuario")

    db.refresh(user)
    return AuthUser(
        id=user.id,
        email=user.email,
        nombre=user.nombre,
        apellidos=user.apellidos,
        activo=user.activo,
    )


@router.post("/login", response_model=Token, summary="Login con email y password")
def login(
    form_data: UsernamePasswordForm = Depends(),
    db: Session = Depends(get_db),
) -> Token:
    stmt = select(Usuario).where(Usuario.email == form_data.username)
    user = db.scalars(stmt).first()

    if user is None or not verify_password(form_data.password, user.hash_contrasena):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales invalidas",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.activo:
        raise HTTPException(status_code=400, detail="Usuario inactivo")

    access_token = create_access_token(subject=user.email)
    return Token(access_token=access_token, token_type="bearer")


@router.get("/me", response_model=AuthUser, summary="Usuario autenticado")
def me(current_user: Usuario = Depends(get_current_user)) -> AuthUser:
    return AuthUser(
        id=current_user.id,
        email=current_user.email,
        nombre=current_user.nombre,
        apellidos=current_user.apellidos,
        activo=current_user.activo,
    )
