#!/usr/bin/env python3
"""
Generador de datos sinteticos para AgroPrecision.

Crea una granja demo con:
- Tipos de cultivo
- Varias parcelas
- Casillas
- Sensores (temperatura, humedad, co2, luminosidad)
- Mediciones historicas para visualizacion en dashboards
"""
from __future__ import annotations

import random
import sys
from dataclasses import dataclass
from datetime import datetime, timedelta, UTC

import requests

API_URL = "http://localhost:8000/api/v1"


@dataclass
class CreatedSensor:
    id: int
    tipo: str
    parcela_id: int


def _request_ok(response: requests.Response, expected: int) -> bool:
    return response.status_code == expected


def _safe_get_json(response: requests.Response):
    try:
        return response.json()
    except ValueError:
        return None


def _create_or_get_demo_farm(session: requests.Session) -> int:
    farm_name = "Granja Demo Visual"
    response = session.post(
        f"{API_URL}/granjas/",
        json={"nombre": farm_name, "ubicacion_geo": "40.4168,-3.7038"},
        timeout=20,
    )
    if _request_ok(response, 201):
        farm_id = response.json()["id"]
        print(f"[OK] Granja creada: {farm_id}")
        return farm_id

    farms_resp = session.get(f"{API_URL}/granjas/?limit=500", timeout=20)
    if not _request_ok(farms_resp, 200):
        raise RuntimeError(f"No se pudo consultar granjas: {farms_resp.status_code} - {farms_resp.text}")

    for farm in farms_resp.json():
        if farm.get("nombre") == farm_name:
            print(f"[INFO] Usando granja existente: {farm['id']}")
            return farm["id"]

    raise RuntimeError(f"No se pudo crear ni encontrar la granja demo: {response.status_code} - {response.text}")


def _create_crop_types(session: requests.Session, farm_id: int) -> dict[str, int]:
    definitions = [
        ("Tomate", 95, 16, 30, 55, 82),
        ("Lechuga", 55, 10, 24, 60, 88),
        ("Pimiento", 105, 18, 32, 50, 78),
    ]

    existing_resp = session.get(f"{API_URL}/tipos-cultivo/?granja_id={farm_id}&limit=500", timeout=20)
    if existing_resp.status_code == 401:
        print("[WARN] /tipos-cultivo requiere auth. Las parcelas se crearan sin tipo_cultivo_id.")
        return {}
    if not _request_ok(existing_resp, 200):
        raise RuntimeError(
            f"No se pudo consultar tipos de cultivo: {existing_resp.status_code} - {existing_resp.text}"
        )

    existing_by_name: dict[str, int] = {item["nombre"]: item["id"] for item in existing_resp.json()}
    result: dict[str, int] = {}

    for name, dias, tmin, tmax, hmin, hmax in definitions:
        if name in existing_by_name:
            result[name] = existing_by_name[name]
            continue

        payload = {
            "granja_id": farm_id,
            "nombre": name,
            "dias_cosecha_est": dias,
            "temp_min_c": tmin,
            "temp_max_c": tmax,
            "hum_suelo_min_pct": hmin,
            "hum_suelo_max_pct": hmax,
        }
        create_resp = session.post(f"{API_URL}/tipos-cultivo/", json=payload, timeout=20)
        if _request_ok(create_resp, 201):
            result[name] = create_resp.json()["id"]
            print(f"[OK] Tipo de cultivo creado: {name}")
            continue

        # Si falla por conflicto, recargar
        refresh = session.get(f"{API_URL}/tipos-cultivo/?granja_id={farm_id}&limit=500", timeout=20)
        if _request_ok(refresh, 200):
            refreshed = {item["nombre"]: item["id"] for item in refresh.json()}
            if name in refreshed:
                result[name] = refreshed[name]
                continue

        print(f"[WARN] No se pudo crear tipo {name}: {create_resp.status_code} - {create_resp.text}")

    return result


def _create_or_get_plot(
    session: requests.Session,
    farm_id: int,
    plot_name: str,
    tamx: int,
    tamy: int,
    tipo_cultivo_id: int | None,
) -> int:
    payload = {
        "granja_id": farm_id,
        "nombre": plot_name,
        "tamx": tamx,
        "tamy": tamy,
        "tipo_cultivo_id": tipo_cultivo_id,
    }
    response = session.post(f"{API_URL}/parcelas/", json=payload, timeout=20)
    if _request_ok(response, 201):
        return response.json()["id"]

    list_resp = session.get(f"{API_URL}/parcelas/?granja_id={farm_id}&limit=500", timeout=20)
    if not _request_ok(list_resp, 200):
        raise RuntimeError(f"No se pudo consultar parcelas: {list_resp.status_code} - {list_resp.text}")

    for plot in list_resp.json():
        if plot.get("nombre") == plot_name:
            return plot["id"]

    raise RuntimeError(f"No se pudo crear ni encontrar parcela {plot_name}: {response.status_code} - {response.text}")


def _ensure_cell(session: requests.Session, parcela_id: int, posx: int, posy: int) -> int:
    response = session.post(
        f"{API_URL}/casillas/",
        json={"parcela_id": parcela_id, "posx": posx, "posy": posy, "estado": "LISTO"},
        timeout=20,
    )
    if _request_ok(response, 201):
        return response.json()["id"]

    cells_resp = session.get(f"{API_URL}/casillas/?parcela_id={parcela_id}&limit=2000", timeout=20)
    if not _request_ok(cells_resp, 200):
        raise RuntimeError(f"No se pudo consultar casillas: {cells_resp.status_code} - {cells_resp.text}")

    for cell in cells_resp.json():
        if cell["posx"] == posx and cell["posy"] == posy:
            return cell["id"]

    raise RuntimeError(
        f"No se pudo crear ni encontrar casilla ({posx},{posy}) en parcela {parcela_id}: "
        f"{response.status_code} - {response.text}"
    )


def _ensure_sensor(session: requests.Session, casilla_id: int, numref: str, tipo: str, fabricante: str) -> int:
    payload = {"casilla_id": casilla_id, "numref": numref, "tipo": tipo, "fabricante": fabricante}
    response = session.post(f"{API_URL}/sensores/", json=payload, timeout=20)
    if _request_ok(response, 201):
        return response.json()["id"]

    sensors_resp = session.get(f"{API_URL}/sensores/?casilla_id={casilla_id}&limit=200", timeout=20)
    if not _request_ok(sensors_resp, 200):
        raise RuntimeError(f"No se pudo consultar sensores: {sensors_resp.status_code} - {sensors_resp.text}")

    for sensor in sensors_resp.json():
        if sensor["numref"] == numref:
            return sensor["id"]

    raise RuntimeError(
        f"No se pudo crear ni encontrar sensor {numref}: {response.status_code} - {response.text}"
    )


def _sensor_variable(sensor_type: str) -> str:
    normalized = sensor_type.lower()
    if "humedad" in normalized:
        return "humedad_suelo"
    if "temp" in normalized:
        return "temperatura_aire"
    if "co2" in normalized:
        return "co2"
    if "lumi" in normalized or "luz" in normalized:
        return "luminosidad"
    return "temperatura_aire"


def _base_value(variable: str) -> float:
    if variable == "humedad_suelo":
        return random.uniform(55, 78)
    if variable == "temperatura_aire":
        return random.uniform(18, 29)
    if variable == "co2":
        return random.uniform(360, 520)
    if variable == "luminosidad":
        return random.uniform(8000, 65000)
    return random.uniform(10, 50)


def _next_value(variable: str, current: float, timestamp: datetime) -> float:
    hour = timestamp.hour
    if variable == "humedad_suelo":
        drift = -random.uniform(0.05, 0.35)
        if random.random() < 0.08:
            drift += random.uniform(3, 9)
        return max(35.0, min(95.0, current + drift + random.gauss(0, 0.35)))

    if variable == "temperatura_aire":
        target = 22 if hour < 8 else (29 if hour < 17 else 20)
        delta = (target - current) * 0.18 + random.gauss(0, 0.4)
        return max(10.0, min(42.0, current + delta))

    if variable == "co2":
        target = 430
        delta = (target - current) * 0.08 + random.gauss(0, 6)
        return max(280.0, min(900.0, current + delta))

    if variable == "luminosidad":
        if 7 <= hour < 11:
            target = random.uniform(18000, 45000)
        elif 11 <= hour < 17:
            target = random.uniform(45000, 90000)
        elif 17 <= hour < 20:
            target = random.uniform(5000, 25000)
        else:
            target = random.uniform(0, 300)
        delta = (target - current) * 0.25 + random.gauss(0, 1200)
        return max(0.0, min(100000.0, current + delta))

    return current


def _seed_measurements(
    session: requests.Session,
    sensors: list[CreatedSensor],
    hours_back: int = 24,
    step_minutes: int = 60,
) -> int:
    now = datetime.now(UTC)
    start = now - timedelta(hours=hours_back)
    total_created = 0

    for sensor in sensors:
        variable = _sensor_variable(sensor.tipo)
        value = _base_value(variable)
        moment = start

        while moment <= now:
            value = _next_value(variable, value, moment)
            payload = {
                "sensor_id": sensor.id,
                "variable": variable,
                "valor": round(value, 2),
                "dia_hora": moment.isoformat(),
            }
            response = session.post(f"{API_URL}/mediciones/", json=payload, timeout=20)
            if _request_ok(response, 201):
                total_created += 1
            elif response.status_code != 400:
                detail = _safe_get_json(response) or response.text
                print(f"[WARN] Medicion no insertada ({sensor.id}): {response.status_code} - {detail}")
            moment += timedelta(minutes=step_minutes)

    return total_created


def main() -> None:
    session = requests.Session()

    print("=" * 60)
    print("SETUP DATOS SINTETICOS - AgroPrecision")
    print("=" * 60)

    farm_id = _create_or_get_demo_farm(session)
    crop_types = _create_crop_types(session, farm_id)

    plot_defs = [
        ("Parcela Norte", 6, 5, "Tomate"),
        ("Parcela Sur", 5, 4, "Lechuga"),
        ("Parcela Este", 4, 4, "Pimiento"),
    ]

    created_sensors: list[CreatedSensor] = []

    for index, (plot_name, tamx, tamy, crop_name) in enumerate(plot_defs, start=1):
        plot_id = _create_or_get_plot(
            session=session,
            farm_id=farm_id,
            plot_name=plot_name,
            tamx=tamx,
            tamy=tamy,
            tipo_cultivo_id=crop_types.get(crop_name),
        )
        print(f"[OK] Parcela lista: {plot_name} (ID {plot_id})")

        positions = [(0, 0), (tamx - 1, 0), (0, tamy - 1), (tamx - 1, tamy - 1)]
        sensor_templates = [
            ("temperatura", "TEMP"),
            ("humedad_suelo", "HUM"),
            ("co2", "CO2"),
            ("luminosidad", "LUX"),
        ]

        for (posx, posy), (tipo, prefix) in zip(positions, sensor_templates):
            cell_id = _ensure_cell(session, plot_id, posx, posy)
            sensor_ref = f"{prefix}-P{index:02d}-{posx}{posy}-DEMO"
            sensor_id = _ensure_sensor(session, cell_id, sensor_ref, tipo, "AgroSynthetic")
            created_sensors.append(CreatedSensor(id=sensor_id, tipo=tipo, parcela_id=plot_id))

    inserted = _seed_measurements(session, created_sensors, hours_back=24, step_minutes=60)

    print("-" * 60)
    print(f"[OK] Granja demo ID: {farm_id}")
    print(f"[OK] Sensores listos: {len(created_sensors)}")
    print(f"[OK] Mediciones insertadas: {inserted}")
    print("-" * 60)
    print("Listo. Puedes abrir:")
    print(f"  - http://localhost:8000/api/v1/parcelas?granja_id={farm_id}")
    print("  - Frontend /farms para ver dashboards con datos")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n[WARN] Interrumpido por usuario (Ctrl+C).")
        sys.exit(130)
    except Exception as exc:  # El script debe fallar ruidoso en setup
        print(f"[ERROR] {exc}")
        sys.exit(1)
