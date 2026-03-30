from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import (
    auth,
    casillas,
    ciclos_cultivo,
    granjas,
    health,
    mediciones,
    parcelas,
    sensores,
    tipos_cultivo,
    usuarios,
)
from app.security import get_current_user

settings = get_settings()

app = FastAPI(
    title=settings.api_title,
    version=settings.api_version,
    description=settings.api_description,
    contact={"name": "AgroPrecision"},
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.parsed_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(auth.router, prefix="/api/v1")
app.include_router(usuarios.router, prefix="/api/v1")
app.include_router(granjas.router, prefix="/api/v1", dependencies=[Depends(get_current_user)])
app.include_router(parcelas.router, prefix="/api/v1", dependencies=[Depends(get_current_user)])
app.include_router(casillas.router, prefix="/api/v1", dependencies=[Depends(get_current_user)])
app.include_router(tipos_cultivo.router, prefix="/api/v1", dependencies=[Depends(get_current_user)])
app.include_router(ciclos_cultivo.router, prefix="/api/v1", dependencies=[Depends(get_current_user)])
app.include_router(sensores.router, prefix="/api/v1", dependencies=[Depends(get_current_user)])
app.include_router(mediciones.router, prefix="/api/v1", dependencies=[Depends(get_current_user)])


@app.get("/", tags=["meta"], summary="Informacion de la API")
def root() -> dict[str, str]:
    return {
        "name": settings.api_title,
        "version": settings.api_version,
        "docs": "/docs",
        "openapi": "/openapi.json",
    }
