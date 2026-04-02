from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class GranjaBase(BaseModel):
    nombre: str = Field(min_length=1, max_length=150)
    ubicacion_geo: str | None = Field(default=None, max_length=255)


class GranjaCreate(GranjaBase):
    pass


class GranjaRead(GranjaBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    creado_en: datetime


class ParcelaBase(BaseModel):
    granja_id: int
    nombre: str = Field(min_length=1, max_length=100)
    tamx: int = Field(gt=0)
    tamy: int = Field(gt=0)


class ParcelaCreate(ParcelaBase):
    pass


class ParcelaRead(ParcelaBase):
    model_config = ConfigDict(from_attributes=True)

    id: int


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


class UsuarioBase(BaseModel):
    email: str
    nombre: str
    apellidos: str
    activo: bool = True


class UsuarioCreate(UsuarioBase):
    hash_contrasena: str


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
