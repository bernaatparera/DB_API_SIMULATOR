# AgroPrecision - Guía Rápida

# Back
## Requisitos
- Docker Desktop
- Python 3.11+

## 1. Base de Datos (Docker)

```bash
docker compose up -d
```

Verificar que está corriendo:
```bash
docker ps
```

## 2. API FastAPI

```bash
# Crear entorno virtual (solo la primera vez)
python -m venv .venv

# Activar entorno
# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# Windows CMD:
.\.venv\Scripts\activate.bat
# Git Bash / Linux / Mac:   (RECOMENDADO)
source .venv/Scripts/activate

# Instalar dependencias (solo la primera vez)
pip install -r requirements.txt

# Levantar API
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**URLs:**
- Swagger UI: http://localhost:8000/docs
- Health check: http://localhost:8000/health/live

## 3. Simulador IoT

> ⚠️ Requiere la API corriendo

```bash
# Primera vez: crear datos de prueba
python scripts/setup_test_data.py

# Ejecutar simulador
python scripts/iot_simulator/main.py
```

**Credenciales del simulador:**
- Usuario: `iot@agroprecision.com`
- Password: `iot12345678`

### Funciones del simulador
| Opción | Descripción |
|--------|-------------|
| 1 | Ver sensores disponibles |
| 2 | Iniciar simulador (envía mediciones automáticas) |
| 3 | Detener simulador |
| 4 | Ver simuladores activos |
| 5 | Configuración |
| 6 | Cambiar credenciales |
| 7 | Salir |

## Variables de Entorno

Ver archivo `.env` para configurar:
- Puertos de BD y API
- Credenciales de PostgreSQL
- JWT secrets
