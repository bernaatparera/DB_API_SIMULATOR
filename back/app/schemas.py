from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class GranjaBase(BaseModel):
    nombre: str = Field(min_length=1, max_length=150)
    ubicacion_geo: str | None = Field(default=None, max_length=255)


class GranjaCreate(GranjaBase):
    pass


class GranjaUpdate(BaseModel):
    nombre: str | None = Field(default=None, min_length=1, max_length=150)
    ubicacion_geo: str | None = Field(default=None, max_length=255)


class GranjaRead(GranjaBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    creado_en: datetime


class ParcelaBase(BaseModel):
    granja_id: int
    tipo_cultivo_id: int | None = None
    nombre: str = Field(min_length=1, max_length=100)
    tamx: int = Field(gt=0)
    tamy: int = Field(gt=0)


class ParcelaCreate(ParcelaBase):
    pass


class ParcelaUpdate(BaseModel):
    granja_id: int | None = None
    tipo_cultivo_id: int | None = None
    nombre: str | None = Field(default=None, min_length=1, max_length=100)
    tamx: int | None = Field(default=None, gt=0)
    tamy: int | None = Field(default=None, gt=0)


class ParcelaRead(ParcelaBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    creado_en: datetime


class ParcelaListRead(ParcelaRead):
    sensores_count: int
    tipo_cultivo_nombre: str | None = None


class CasillaBase(BaseModel):
    parcela_id: int
    posx: int = Field(ge=0)
    posy: int = Field(ge=0)
    estado: str = Field(default="VACIO", min_length=1, max_length=50)


class CasillaCreate(CasillaBase):
    pass


class CasillaRead(CasillaBase):
    model_config = ConfigDict(from_attributes=True)

    id: int


class TipoCultivoBase(BaseModel):
    granja_id: int
    nombre: str = Field(min_length=1, max_length=100)
    dias_cosecha_est: int = Field(gt=0)
    temp_min_c: float | None = None
    temp_max_c: float | None = None
    hum_suelo_min_pct: float | None = None
    hum_suelo_max_pct: float | None = None


class TipoCultivoCreate(TipoCultivoBase):
    pass


class TipoCultivoUpdate(BaseModel):
    granja_id: int | None = None
    nombre: str | None = Field(default=None, min_length=1, max_length=100)
    dias_cosecha_est: int | None = Field(default=None, gt=0)
    temp_min_c: float | None = None
    temp_max_c: float | None = None
    hum_suelo_min_pct: float | None = None
    hum_suelo_max_pct: float | None = None


class TipoCultivoRead(TipoCultivoBase):
    model_config = ConfigDict(from_attributes=True)

    id: int


class SensorBase(BaseModel):
    casilla_id: int
    numref: str = Field(min_length=1, max_length=100)
    fabricante: str | None = Field(default=None, max_length=150)
    tipo: str = Field(min_length=1, max_length=50)


class SensorCreate(SensorBase):
    pass


class SensorUpdate(BaseModel):
    casilla_id: int | None = None
    numref: str | None = Field(default=None, min_length=1, max_length=100)
    fabricante: str | None = Field(default=None, max_length=150)
    tipo: str | None = Field(default=None, min_length=1, max_length=50)


class SensorRead(SensorBase):
    model_config = ConfigDict(from_attributes=True)

    id: int


class MedicionBase(BaseModel):
    sensor_id: int
    variable: str = Field(min_length=1, max_length=50)
    valor: float
    dia_hora: datetime | None = None


class MedicionCreate(MedicionBase):
    pass


class MedicionRead(MedicionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    dia_hora: datetime


class ParcelaMedicionRead(BaseModel):
    id: int
    sensor_id: int
    casilla_id: int
    variable: str
    valor: float
    dia_hora: datetime


class ParcelaMedicionPage(BaseModel):
    total: int
    limit: int
    offset: int
    page: int | None = None
    items: list[ParcelaMedicionRead]


class UsuarioBase(BaseModel):
    email: str
    nombre: str
    apellidos: str
    activo: bool = True


class UsuarioCreate(UsuarioBase):
    hash_contrasena: str


class UsuarioUpdate(BaseModel):
    email: str | None = None
    nombre: str | None = None
    apellidos: str | None = None
    activo: bool | None = None
    hash_contrasena: str | None = Field(default=None, min_length=8, max_length=128)


class UsuarioRead(UsuarioBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    creado_en: datetime


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenPayload(BaseModel):
    sub: str
    exp: int


class AuthUser(BaseModel):
    id: UUID
    email: str
    nombre: str
    apellidos: str
    activo: bool


class RegisterRequest(BaseModel):
    username: str
    password: str = Field(min_length=8, max_length=128)
    nombre: str = Field(min_length=1, max_length=100)
    apellidos: str = Field(min_length=1, max_length=150)


class CicloCultivoBase(BaseModel):
    casilla_id: int
    tipo_cultivo_id: int
    fecha_siembra: date | None = None
    fecha_cosecha: date | None = None
    estado: str = Field(default="CRECIENDO", min_length=1, max_length=50)


class CicloCultivoCreate(CicloCultivoBase):
    pass


class CicloCultivoRead(CicloCultivoBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
