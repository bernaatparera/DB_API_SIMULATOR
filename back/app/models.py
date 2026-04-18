from sqlalchemy import BIGINT, BOOLEAN, DATE, ForeignKey, Integer, Numeric, String, Text, TIMESTAMP, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Usuario(Base):
    __tablename__ = "usuario"

    id: Mapped[str] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    hash_contrasena: Mapped[str] = mapped_column(String(255), nullable=False)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    apellidos: Mapped[str] = mapped_column(String(150), nullable=False)
    activo: Mapped[bool] = mapped_column(BOOLEAN, nullable=False, server_default=text("TRUE"))
    creado_en: Mapped[str] = mapped_column(TIMESTAMP(timezone=True), nullable=False, server_default=text("CURRENT_TIMESTAMP"))


class Granja(Base):
    __tablename__ = "granja"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nombre: Mapped[str] = mapped_column(String(150), nullable=False)
    ubicacion_geo: Mapped[str | None] = mapped_column(String(255))
    creado_en: Mapped[str] = mapped_column(TIMESTAMP(timezone=True), nullable=False, server_default=text("CURRENT_TIMESTAMP"))


class TipoCultivo(Base):
    __tablename__ = "tipo_cultivo"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    granja_id: Mapped[int] = mapped_column(ForeignKey("granja.id", ondelete="CASCADE"), nullable=False)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    dias_cosecha_est: Mapped[int] = mapped_column(Integer, nullable=False)
    temp_min_c: Mapped[float | None] = mapped_column(Numeric(5, 2))
    temp_max_c: Mapped[float | None] = mapped_column(Numeric(5, 2))
    hum_suelo_min_pct: Mapped[float | None] = mapped_column(Numeric(5, 2))
    hum_suelo_max_pct: Mapped[float | None] = mapped_column(Numeric(5, 2))


class UsuarioGranja(Base):
    __tablename__ = "usuario_granja"

    usuario_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("usuario.id", ondelete="CASCADE"), primary_key=True)
    granja_id: Mapped[int] = mapped_column(ForeignKey("granja.id", ondelete="CASCADE"), primary_key=True)
    rol: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'TRABAJADOR'"))


class Parcela(Base):
    __tablename__ = "parcela"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    granja_id: Mapped[int] = mapped_column(ForeignKey("granja.id", ondelete="CASCADE"), nullable=False)
    tipo_cultivo_id: Mapped[int | None] = mapped_column(ForeignKey("tipo_cultivo.id", ondelete="SET NULL"))
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    tamx: Mapped[int] = mapped_column(Integer, nullable=False)
    tamy: Mapped[int] = mapped_column(Integer, nullable=False)
    creado_en: Mapped[str] = mapped_column(TIMESTAMP(timezone=True), nullable=False, server_default=text("CURRENT_TIMESTAMP"))


class Casilla(Base):
    __tablename__ = "casilla"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    parcela_id: Mapped[int] = mapped_column(ForeignKey("parcela.id", ondelete="CASCADE"), nullable=False)
    posx: Mapped[int] = mapped_column(Integer, nullable=False)
    posy: Mapped[int] = mapped_column(Integer, nullable=False)
    estado: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'VACIO'"))


class Sensor(Base):
    __tablename__ = "sensor"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    casilla_id: Mapped[int] = mapped_column(ForeignKey("casilla.id", ondelete="CASCADE"), nullable=False)
    numref: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    fabricante: Mapped[str | None] = mapped_column(String(150))
    tipo: Mapped[str] = mapped_column(String(50), nullable=False)


class CicloCultivo(Base):
    __tablename__ = "ciclo_cultivo"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    casilla_id: Mapped[int] = mapped_column(ForeignKey("casilla.id", ondelete="CASCADE"), nullable=False)
    tipo_cultivo_id: Mapped[int] = mapped_column(ForeignKey("tipo_cultivo.id", ondelete="RESTRICT"), nullable=False)
    fecha_siembra: Mapped[str] = mapped_column(DATE, nullable=False, server_default=text("CURRENT_DATE"))
    fecha_cosecha: Mapped[str | None] = mapped_column(DATE)
    estado: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'CRECIENDO'"))


class Medicion(Base):
    __tablename__ = "medicion"

    id: Mapped[int] = mapped_column(BIGINT, primary_key=True)
    sensor_id: Mapped[int] = mapped_column(ForeignKey("sensor.id", ondelete="CASCADE"), nullable=False)
    variable: Mapped[str] = mapped_column(String(50), nullable=False)
    valor: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    dia_hora: Mapped[str] = mapped_column(TIMESTAMP(timezone=True), nullable=False, server_default=text("CURRENT_TIMESTAMP"))


class RegistroManual(Base):
    __tablename__ = "registro_manual"

    id: Mapped[int] = mapped_column(BIGINT, primary_key=True)
    casilla_id: Mapped[int] = mapped_column(ForeignKey("casilla.id", ondelete="CASCADE"), nullable=False)
    usuario_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("usuario.id", ondelete="RESTRICT"), nullable=False)
    puntuacion: Mapped[float | None] = mapped_column(Numeric(3, 1))
    descripcion: Mapped[str | None] = mapped_column(Text)
    imagen_url: Mapped[str | None] = mapped_column(String(255))
    dia_hora: Mapped[str] = mapped_column(TIMESTAMP(timezone=True), nullable=False, server_default=text("CURRENT_TIMESTAMP"))
