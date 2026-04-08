# AgroPrecision - Guía Rápida

# Back
## Requisitos
- Docker Desktop
- Python 3.11+

## 1. Base de Datos (Docker) y API FastAPI

```bash
docker compose up -d
```

Esto levanta automáticamente:

- Base de datos PostgreSQL
- API FastAPI

Verificar que está corriendo:
```bash
docker ps
```

Deberías ver contenedores como:

- agroprecision-db
- agroprecision-api

**URLs:**
- Swagger UI: http://localhost:8000/docs
- Health check: http://localhost:8000/health/live

### Nota sobre FastAPI

La API ya no se ejecuta manualmente con uvicorn.
Se inicia automáticamente al levantar Docker.

## 3. Simulador IoT

> ⚠️ Requiere la API corriendo

```bash
# Primera vez: crear datos de prueba
python scripts/setup_test_data.py

# Ejecutar simulador
python scripts/iot_simulator/main.py
```

### Funciones del simulador
| Opción | Descripción |
|--------|-------------|
| 1 | Ver sensores disponibles |
| 2 | Iniciar simulador (envía mediciones automáticas) |
| 3 | Detener simulador |
| 4 | Ver simuladores activos |
| 5 | Configuración |
| 6 | Crear sensor e iniciar (crea granja + parcela + casilla + sensor) |
| 7 | Salir |

## Variables de Entorno

Ver archivo `.env` para configurar:
- Puertos de BD y API
- Credenciales de PostgreSQL
- JWT secrets
