#!/usr/bin/env python3
"""
Script para crear datos de prueba en la API de AgroPrecision
Crea: usuario IoT, granja, parcela, casillas y sensores de prueba
"""
import requests
import sys

API_URL = "http://localhost:8000/api/v1"

# Credenciales del usuario IoT
IOT_USER = {
    "username": "iot@agroprecision.com",
    "password": "iot12345678",
    "nombre": "Simulador",
    "apellidos": "IoT"
}


def main():
    session = requests.Session()
    
    print("=" * 50)
    print("🌱 SETUP DE DATOS DE PRUEBA - AgroPrecision")
    print("=" * 50)
    
    # 1. Registrar usuario IoT
    print("\n1️⃣  Registrando usuario IoT...")
    resp = session.post(f"{API_URL}/auth/register", json=IOT_USER)
    if resp.status_code == 201:
        print(f"   ✅ Usuario creado: {IOT_USER['username']}")
    elif resp.status_code == 400:
        print(f"   ⚠️  Usuario ya existe: {IOT_USER['username']}")
    else:
        print(f"   ❌ Error: {resp.status_code} - {resp.text}")
    
    # 2. Login
    print("\n2️⃣  Haciendo login...")
    resp = session.post(
        f"{API_URL}/auth/login",
        data={"username": IOT_USER["username"], "password": IOT_USER["password"]},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    if resp.status_code != 200:
        print(f"   ❌ Login fallido: {resp.text}")
        sys.exit(1)
    
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("   ✅ Login exitoso")
    
    # 3. Crear granja
    print("\n3️⃣  Creando granja de prueba...")
    granja_data = {
        "nombre": "Granja IoT Demo",
        "ubicacion_geo": "40.4168,-3.7038"
    }
    resp = session.post(f"{API_URL}/granjas", json=granja_data, headers=headers)
    if resp.status_code == 201:
        granja_id = resp.json()["id"]
        print(f"   ✅ Granja creada (ID: {granja_id})")
    elif resp.status_code == 400:
        # Intentar obtener granja existente
        resp = session.get(f"{API_URL}/granjas", headers=headers)
        granjas = resp.json()
        if granjas:
            granja_id = granjas[0]["id"]
            print(f"   ⚠️  Usando granja existente (ID: {granja_id})")
        else:
            print("   ❌ No se pudo crear ni obtener granja")
            sys.exit(1)
    else:
        print(f"   ❌ Error: {resp.status_code} - {resp.text}")
        sys.exit(1)
    
    # 4. Crear parcela
    print("\n4️⃣  Creando parcela de prueba...")
    parcela_data = {
        "granja_id": granja_id,
        "nombre": "Parcela Sensores IoT",
        "tamx": 5,
        "tamy": 5
    }
    resp = session.post(f"{API_URL}/parcelas", json=parcela_data, headers=headers)
    if resp.status_code == 201:
        parcela_id = resp.json()["id"]
        print(f"   ✅ Parcela creada (ID: {parcela_id})")
    else:
        # Obtener parcela existente
        resp = session.get(f"{API_URL}/parcelas?granja_id={granja_id}", headers=headers)
        parcelas = resp.json()
        if parcelas:
            parcela_id = parcelas[0]["id"]
            print(f"   ⚠️  Usando parcela existente (ID: {parcela_id})")
        else:
            print(f"   ❌ Error: {resp.status_code}")
            sys.exit(1)
    
    # 5. Crear casillas
    print("\n5️⃣  Creando casillas...")
    casillas_ids = []
    for i in range(4):  # 4 casillas para 4 sensores
        casilla_data = {
            "parcela_id": parcela_id,
            "posx": i,
            "posy": 0,
            "estado": "LISTO"
        }
        resp = session.post(f"{API_URL}/casillas", json=casilla_data, headers=headers)
        if resp.status_code == 201:
            casillas_ids.append(resp.json()["id"])
        elif resp.status_code == 400:
            # Buscar casilla existente
            resp = session.get(f"{API_URL}/casillas?parcela_id={parcela_id}", headers=headers)
            casillas = resp.json()
            for c in casillas:
                if c["posx"] == i and c["posy"] == 0:
                    casillas_ids.append(c["id"])
                    break
    
    print(f"   ✅ {len(casillas_ids)} casillas disponibles")
    
    # 6. Crear sensores de diferentes tipos
    print("\n6️⃣  Creando sensores de prueba...")
    
    sensores = [
        {"tipo": "temperatura", "fabricante": "TempSense Inc.", "prefix": "TEMP"},
        {"tipo": "humedad_suelo", "fabricante": "HydroTech", "prefix": "HUM"},
        {"tipo": "co2", "fabricante": "AirQuality Ltd.", "prefix": "CO2"},
        {"tipo": "luminosidad", "fabricante": "LuxMeter Corp.", "prefix": "LUX"},
    ]
    
    created_sensors = []
    
    for i, sensor_def in enumerate(sensores):
        if i >= len(casillas_ids):
            break
        
        sensor_data = {
            "casilla_id": casillas_ids[i],
            "numref": f"{sensor_def['prefix']}-001-DEMO",
            "fabricante": sensor_def["fabricante"],
            "tipo": sensor_def["tipo"]
        }
        
        resp = session.post(f"{API_URL}/sensores", json=sensor_data, headers=headers)
        if resp.status_code == 201:
            sensor = resp.json()
            created_sensors.append(sensor)
            print(f"   ✅ Sensor creado: {sensor['numref']} (ID: {sensor['id']}, Tipo: {sensor['tipo']})")
        elif resp.status_code == 400:
            print(f"   ⚠️  Sensor {sensor_def['prefix']} ya existe o error")
    
    # 7. Verificar sensores existentes
    print("\n7️⃣  Verificando sensores disponibles...")
    resp = session.get(f"{API_URL}/sensores", headers=headers)
    if resp.status_code == 200:
        all_sensors = resp.json()
        print(f"   📊 Total de sensores: {len(all_sensors)}")
        for s in all_sensors:
            print(f"      [{s['id']}] {s['numref']} - {s['tipo']}")
    
    print("\n" + "=" * 50)
    print("✅ SETUP COMPLETADO")
    print("=" * 50)
    print("\nAhora puedes ejecutar el simulador:")
    print("  python scripts/iot_simulator/main.py")
    print("\nCredenciales IoT:")
    print(f"  Usuario: {IOT_USER['username']}")
    print(f"  Password: {IOT_USER['password']}")


if __name__ == "__main__":
    main()
