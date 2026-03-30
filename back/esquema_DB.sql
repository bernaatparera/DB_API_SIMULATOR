-- ==============================================================================
-- BASE DE DATOS: AgroPrecision (MVP)
-- MOTOR: PostgreSQL
-- ==============================================================================

-- Habilitar extensión para generar UUIDs automáticamente (Nativo en PG >= 13)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. TABLAS PRINCIPALES (Sin claves foráneas)
-- ------------------------------------------------------------------------------

CREATE TABLE USUARIO (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hash_contrasena VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellidos VARCHAR(150) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE GRANJA (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    ubicacion_geo VARCHAR(255), -- Podría cambiarse a tipo 'geometry' de PostGIS en el futuro
    creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE TIPO_CULTIVO (
    id SERIAL PRIMARY KEY,
    granja_id INT REFERENCES GRANJA(id) ON DELETE CASCADE, -- Cada granja define sus cultivos
    nombre VARCHAR(100) NOT NULL, 
    dias_cosecha_est INT NOT NULL,
    temp_min_c NUMERIC(5,2), -- ej: 15.00 ºC
    temp_max_c NUMERIC(5,2), -- ej: 25.00 ºC
    hum_suelo_min_pct NUMERIC(5,2), -- ej: 60.00 %
    hum_suelo_max_pct NUMERIC(5,2)  -- ej: 80.00 %
);

-- ------------------------------------------------------------------------------
-- 2. TABLAS DE RELACIÓN Y ESTRUCTURA ESPACIAL
-- ------------------------------------------------------------------------------

CREATE TABLE USUARIO_GRANJA (
    usuario_id UUID NOT NULL REFERENCES USUARIO(id) ON DELETE CASCADE,
    granja_id INT NOT NULL REFERENCES GRANJA(id) ON DELETE CASCADE,
    rol VARCHAR(50) NOT NULL DEFAULT 'TRABAJADOR', -- ej: PROPIETARIO, TRABAJADOR, CONSULTOR
    PRIMARY KEY (usuario_id, granja_id)
);

CREATE TABLE PARCELA (
    id SERIAL PRIMARY KEY,
    granja_id INT NOT NULL REFERENCES GRANJA(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    tamX INT NOT NULL CHECK (tamX > 0), -- Columnas de la malla
    tamY INT NOT NULL CHECK (tamY > 0)  -- Filas de la malla
);

CREATE TABLE CASILLA (
    id SERIAL PRIMARY KEY,
    parcela_id INT NOT NULL REFERENCES PARCELA(id) ON DELETE CASCADE,
    posX INT NOT NULL CHECK (posX >= 0),
    posY INT NOT NULL CHECK (posY >= 0),
    estado VARCHAR(50) NOT NULL DEFAULT 'VACIO', -- ej: 'VACIO', 'LISTO', 'NECESITA_RIEGO', 'PLAGA'
    UNIQUE (parcela_id, posX, posY) -- Evita que dos casillas ocupen la misma coordenada en una parcela
);

CREATE TABLE SENSOR (
    id SERIAL PRIMARY KEY,
    casilla_id INT NOT NULL REFERENCES CASILLA(id) ON DELETE CASCADE,
    numRef VARCHAR(100) UNIQUE NOT NULL,
    fabricante VARCHAR (150),
    tipo VARCHAR(50) NOT NULL 
);

-- ------------------------------------------------------------------------------
-- 3. HISTORICO Y TABLAS TRANSACCIONALES (Series Temporales y Eventos)
-- ------------------------------------------------------------------------------

CREATE TABLE CICLO_CULTIVO (
    id SERIAL PRIMARY KEY,
    casilla_id INT NOT NULL REFERENCES CASILLA(id) ON DELETE CASCADE,
    tipo_cultivo_id INT NOT NULL REFERENCES TIPO_CULTIVO(id) ON DELETE RESTRICT,
    fecha_siembra DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_cosecha DATE, -- Si es NULL, significa que la planta sigue ahí actualmente
    estado VARCHAR(50) NOT NULL DEFAULT 'CRECIENDO' -- ej: 'CRECIENDO', 'COSECHADO', 'PERDIDO_PLAGA'
);

CREATE TABLE MEDICION (
    id BIGSERIAL PRIMARY KEY, -- BIGSERIAL porque IoT genera millones de registros
    sensor_id INT NOT NULL REFERENCES SENSOR(id) ON DELETE CASCADE,
    variable VARCHAR(50) NOT NULL, -- ej: 'humedad_suelo', 'temperatura_aire', 'co2'
    valor NUMERIC(10, 2) NOT NULL, -- NUMERIC es mejor que FLOAT para precisión exacta
    dia_hora TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE REGISTRO_MANUAL (
    id BIGSERIAL PRIMARY KEY,
    casilla_id INT NOT NULL REFERENCES CASILLA(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES USUARIO(id) ON DELETE RESTRICT,
    puntuacion NUMERIC(3, 1) CHECK (puntuacion >= 0 AND puntuacion <= 10), -- ej: 0.0 a 10.0
    descripcion TEXT,
    imagen_url VARCHAR(255), -- Ruta
    dia_hora TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 4. ÍNDICES DE RENDIMIENTO (Performance Tuning)
-- ------------------------------------------------------------------------------

-- Índice para cargar rápido el grid de una parcela en la PWA
CREATE INDEX idx_casilla_parcela ON CASILLA(parcela_id);

-- Índice compuesto para series temporales (Crucial para los gráficos del Dashboard)
-- Permite buscar rapidísimo todas las lecturas de un sensor en un rango de fechas
CREATE INDEX idx_medicion_sensor_tiempo ON MEDICION(sensor_id, dia_hora DESC);

-- Índice para buscar rápido qué registros hizo un usuario o buscar el historial de una casilla
CREATE INDEX idx_ciclo_casilla ON CICLO_CULTIVO(casilla_id);
CREATE INDEX idx_registro_casilla_tiempo ON REGISTRO_MANUAL(casilla_id, dia_hora DESC);