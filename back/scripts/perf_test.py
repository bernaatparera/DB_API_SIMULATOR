import concurrent.futures
import json
import statistics
import time
import urllib.error
import urllib.parse
import urllib.request
from typing import Callable

BASE = "http://127.0.0.1:8000"


def req(method: str, path: str, data=None, headers=None):
    url = f"{BASE}{path}"
    hdrs = headers.copy() if headers else {}

    body = None
    if data is not None:
        if hdrs.get("Content-Type") == "application/x-www-form-urlencoded":
            if isinstance(data, dict):
                body = urllib.parse.urlencode(data).encode("utf-8")
            else:
                body = data.encode("utf-8")
        else:
            hdrs.setdefault("Content-Type", "application/json")
            body = json.dumps(data).encode("utf-8")

    request = urllib.request.Request(url=url, method=method, data=body, headers=hdrs)
    with urllib.request.urlopen(request, timeout=30) as response:
        raw = response.read().decode("utf-8")
        if raw:
            return json.loads(raw)
        return None


def percentile(values: list[float], p: float) -> float:
    if not values:
        return float("nan")
    v = sorted(values)
    idx = max(0, min(len(v) - 1, int((p / 100.0) * len(v) + 0.999999) - 1))
    return round(v[idx], 2)


def measure_endpoint(fn: Callable[[], None], n: int):
    lat = []
    ok = 0
    err = 0
    for _ in range(n):
        t0 = time.perf_counter()
        try:
            fn()
            ok += 1
        except Exception:
            err += 1
        lat.append((time.perf_counter() - t0) * 1000.0)

    return {
        "ok": ok,
        "err": err,
        "avg_ms": round(statistics.fmean(lat), 2) if lat else float("nan"),
        "p95_ms": percentile(lat, 95),
        "p99_ms": percentile(lat, 99),
        "max_ms": round(max(lat), 2) if lat else float("nan"),
    }


def main():
    run_id = time.strftime("%Y%m%d%H%M%S")

    req("GET", "/health/ready")

    email = f"perf_user_{run_id}@mail.com"
    req(
        "POST",
        "/api/v1/auth/register",
        data={
            "username": email,
            "password": "PerfPass123",
            "nombre": "Perf",
            "apellidos": "Tester",
        },
    )

    login = req(
        "POST",
        "/api/v1/auth/login",
        data={"username": email, "password": "PerfPass123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    token = login["access_token"]
    auth_headers = {"Authorization": f"Bearer {token}"}

    granja = req(
        "POST",
        "/api/v1/granjas/",
        data={"nombre": f"PerfGranja_{run_id}", "ubicacion_geo": "POINT(5 5)"},
        headers=auth_headers,
    )
    parcela = req(
        "POST",
        "/api/v1/parcelas/",
        data={"granja_id": granja["id"], "nombre": f"PerfParcela_{run_id}", "tamx": 10, "tamy": 10},
        headers=auth_headers,
    )
    casilla = req(
        "POST",
        "/api/v1/casillas/",
        data={"parcela_id": parcela["id"], "posx": 1, "posy": 1, "estado": "LISTO"},
        headers=auth_headers,
    )
    sensor = req(
        "POST",
        "/api/v1/sensores/",
        data={
            "casilla_id": casilla["id"],
            "numref": f"PERF_SENSOR_{run_id}",
            "fabricante": "ESP32",
            "tipo": "humedad_suelo",
        },
        headers=auth_headers,
    )

    workers = 6
    per_worker = 120

    def writer(worker_idx: int):
        ok = 0
        err = 0
        lat = []
        for i in range(per_worker):
            payload = {
                "sensor_id": sensor["id"],
                "variable": "humedad_suelo",
                "valor": 30 + ((i + worker_idx) % 40),
            }
            t0 = time.perf_counter()
            try:
                req("POST", "/api/v1/mediciones/", data=payload, headers=auth_headers)
                ok += 1
            except Exception:
                err += 1
            lat.append((time.perf_counter() - t0) * 1000.0)
        return ok, err, lat

    total_ok = 0
    total_err = 0
    all_lat = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as ex:
        futures = [ex.submit(writer, w) for w in range(workers)]
        for fut in concurrent.futures.as_completed(futures):
            ok, err, lat = fut.result()
            total_ok += ok
            total_err += err
            all_lat.extend(lat)

    conc = {
        "workers": workers,
        "per_worker": per_worker,
        "total_req": workers * per_worker,
        "ok": total_ok,
        "err": total_err,
        "avg_ms": round(statistics.fmean(all_lat), 2),
        "p50_ms": percentile(all_lat, 50),
        "p95_ms": percentile(all_lat, 95),
        "p99_ms": percentile(all_lat, 99),
        "max_ms": round(max(all_lat), 2),
    }

    m_login = measure_endpoint(
        lambda: req(
            "POST",
            "/api/v1/auth/login",
            data={"username": email, "password": "PerfPass123"},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        ),
        60,
    )
    m_granjas = measure_endpoint(
        lambda: req("GET", "/api/v1/granjas/?skip=0&limit=100", headers=auth_headers),
        80,
    )
    m_med = measure_endpoint(
        lambda: req(
            "GET",
            f"/api/v1/mediciones/?sensor_id={sensor['id']}&limit=200",
            headers=auth_headers,
        ),
        80,
    )

    req("GET", "/health/ready")

    print(f"RUN_ID={run_id}")
    print(
        "CONCURRENCY_POST_MEDICIONES "
        f"workers={conc['workers']} perWorker={conc['per_worker']} totalReq={conc['total_req']} "
        f"ok={conc['ok']} err={conc['err']} avg_ms={conc['avg_ms']} "
        f"p50_ms={conc['p50_ms']} p95_ms={conc['p95_ms']} p99_ms={conc['p99_ms']} max_ms={conc['max_ms']}"
    )
    print(
        "LAT_AUTH_LOGIN "
        f"n=60 ok={m_login['ok']} err={m_login['err']} avg_ms={m_login['avg_ms']} "
        f"p95_ms={m_login['p95_ms']} p99_ms={m_login['p99_ms']} max_ms={m_login['max_ms']}"
    )
    print(
        "LAT_GET_GRANJAS "
        f"n=80 ok={m_granjas['ok']} err={m_granjas['err']} avg_ms={m_granjas['avg_ms']} "
        f"p95_ms={m_granjas['p95_ms']} p99_ms={m_granjas['p99_ms']} max_ms={m_granjas['max_ms']}"
    )
    print(
        "LAT_GET_MEDICIONES "
        f"n=80 ok={m_med['ok']} err={m_med['err']} avg_ms={m_med['avg_ms']} "
        f"p95_ms={m_med['p95_ms']} p99_ms={m_med['p99_ms']} max_ms={m_med['max_ms']}"
    )
    print("FINAL_HEALTH=OK")


if __name__ == "__main__":
    main()
