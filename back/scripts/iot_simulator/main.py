#!/usr/bin/env python3
"""
Simulador IoT Interactivo para AgroPrecision
CLI principal con menu interactivo para gestionar sensores simulados sin caracteres especiales
"""
import os
import sys
import time
import threading
import uuid
from datetime import datetime
from typing import Dict, Optional
from dataclasses import dataclass

# Anadir el directorio raiz al path para importaciones absolutas
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from scripts.iot_simulator.config import config
from scripts.iot_simulator.api_client import api_client, Sensor
from scripts.iot_simulator.sensors import get_generator_for_sensor_type, SensorGenerator


@dataclass
class ActiveSimulator:
    """Modelo de datos que representa un simulador en ejecucion"""
    sensor: Sensor
    generator: SensorGenerator
    interval: float
    thread: threading.Thread
    running: bool
    started_at: datetime
    total_sent: int = 0
    last_value: Optional[float] = None
    last_sent_at: Optional[datetime] = None


class SimulatorManager:
    """Gestor de concurrencia y ciclo de vida de los simuladores activos"""
    
    def __init__(self):
        # Diccionario para mapear ID del sensor con su hilo de simulacion
        self.active_simulators: Dict[int, ActiveSimulator] = {}
        # Candado para prevenir condiciones de carrera en operaciones concurrentes
        self._lock = threading.Lock()
    
    def start_simulator(self, sensor: Sensor, interval: float) -> bool:
        """Inicializa un nuevo hilo de simulacion para un sensor especifico"""
        if sensor.id in self.active_simulators:
            print(f"[WARN] El sensor {sensor.id} ya se encuentra activo")
            return False
        
        generator = get_generator_for_sensor_type(sensor.tipo)
        
        sim = ActiveSimulator(
            sensor=sensor,
            generator=generator,
            interval=interval,
            thread=None,
            running=True,
            started_at=datetime.now()
        )
        
        # Hilo en modo daemon para que termine cuando el proceso principal se cierre
        thread = threading.Thread(
            target=self._simulation_loop,
            args=(sensor.id,),
            daemon=True
        )
        sim.thread = thread
        
        with self._lock:
            self.active_simulators[sensor.id] = sim
        
        thread.start()
        return True
    
    def _simulation_loop(self, sensor_id: int):
        """Bucle infinito del hilo dedicado a enviar telemetria"""
        while True:
            with self._lock:
                sim = self.active_simulators.get(sensor_id)
                # Terminar el hilo si el simulador ya no existe o se solicito parada
                if sim is None or not sim.running:
                    break
            
            # Recuperar lectura del generador especifico
            value = sim.generator.read()
            variable = sim.generator.variable_name
            
            # Enviar la peticion al backend
            success = api_client.enviar_medicion(sensor_id, variable, value)
            
            # Actualizar estado estadistico del simulador
            with self._lock:
                sim = self.active_simulators.get(sensor_id)
                if sim:
                    sim.last_value = value
                    sim.last_sent_at = datetime.now()
                    if success:
                        sim.total_sent += 1
            
            # Suspender ejecucion hasta el siguiente ciclo
            time.sleep(sim.interval)
    
    def stop_simulator(self, sensor_id: int) -> bool:
        """Detiene un hilo especifico cambiando su bandera de estado"""
        with self._lock:
            sim = self.active_simulators.get(sensor_id)
            if sim:
                sim.running = False
                del self.active_simulators[sensor_id]
                return True
        return False
    
    def stop_all(self):
        """Detiene todos los hilos de simulacion activos"""
        with self._lock:
            for sim in self.active_simulators.values():
                sim.running = False
            self.active_simulators.clear()
    
    def get_status(self) -> list[dict]:
        """Extrae metadata segura de los simuladores para visualizacion"""
        status = []
        with self._lock:
            for sensor_id, sim in self.active_simulators.items():
                elapsed = datetime.now() - sim.started_at
                status.append({
                    "sensor_id": sensor_id,
                    "numref": sim.sensor.numref,
                    "tipo": sim.sensor.tipo,
                    "variable": sim.generator.variable_name,
                    "interval": sim.interval,
                    "total_sent": sim.total_sent,
                    "last_value": sim.last_value,
                    "last_sent_at": sim.last_sent_at,
                    "elapsed": str(elapsed).split('.')[0]
                })
        return status


# Instancia gestora global
manager = SimulatorManager()


def clear_screen():
    """Limpia la terminal dependiendo del sistema operativo"""
    os.system('cls' if os.name == 'nt' else 'clear')


def print_header():
    """Renderiza el banner superior de la aplicacion"""
    print("\n" + "=" * 55)
    print("    [+] SIMULADOR IoT - AgroPrecision [+]")
    print("=" * 55)


def print_menu():
    """Renderiza el menu de opciones sin caracteres especiales"""
    print("\n+-----------------------------------------------------+")
    print("|                  MENU PRINCIPAL                     |")
    print("+-----------------------------------------------------+")
    print("|  1. [L] Ver sensores disponibles                    |")
    print("|  2. [>] Iniciar simulador                           |")
    print("|  3. [X] Detener simulador                           |")
    print("|  4. [I] Ver simuladores activos                     |")
    print("|  5. [C] Configuracion                               |")
    print("|  6. [+] Crear sensor e iniciar                      |")
    print("|  7. [Q] Salir                                       |")
    print("+-----------------------------------------------------+")


def show_sensors():
    """Vista: Lista de sensores dados de alta en el sistema"""
    print("\n[INFO] SENSORES DISPONIBLES")
    print("-" * 60)
    
    sensores = api_client.get_sensores()
    
    if not sensores:
        print("  No hay sensores disponibles en el sistema.")
        return
    
    active_ids = set(manager.active_simulators.keys())
    
    print(f"{'ID':<6} {'NumRef':<20} {'Tipo':<15} {'Casilla':<10} {'Estado'}")
    print("-" * 60)
    
    for s in sensores:
        status = "[ACTIVO]" if s.id in active_ids else "[INACTIVO]"
        print(f"{s.id:<6} {s.numref:<20} {s.tipo:<15} {s.casilla_id:<10} {status}")
    
    print(f"\nTotal: {len(sensores)} sensor(es)")


def start_simulator_menu():
    """Vista interactiva: Inicio masivo o individual de simuladores"""
    print("\n[>] INICIAR SIMULADOR")
    print("-" * 40)
    
    sensores = api_client.get_sensores()
    
    if not sensores:
        print("[WARN] No hay sensores registrados en la base de datos.")
        return
    
    print("\nSensores disponibles (Inactivos):")
    for s in sensores:
        if s.id not in manager.active_simulators:
            print(f"  [{s.id}] {s.numref} - {s.tipo}")
    
    print("\nComandos:")
    print("  - ID unico (ej: 1)")
    print("  - IDs multiples (ej: 1,2,3)")
    print("  - 'all' para activar todos")
    print("  - 'q' para cancelar")
    
    choice = input("\n> Comando: ").strip().lower()
    
    if choice == 'q':
        return
    
    sensor_ids = []
    if choice == 'all':
        sensor_ids = [s.id for s in sensores if s.id not in manager.active_simulators]
    else:
        try:
            sensor_ids = [int(x.strip()) for x in choice.split(',')]
        except ValueError:
            print("[ERROR] Formato de IDs invalido.")
            return
    
    interval_str = input(f"\nIntervalo de transmision (segundos) [{config.default_interval_seconds}]: ").strip()
    try:
        interval = float(interval_str) if interval_str else config.default_interval_seconds
        interval = max(config.min_interval_seconds, min(config.max_interval_seconds, interval))
    except ValueError:
        interval = config.default_interval_seconds
    
    sensor_map = {s.id: s for s in sensores}
    started = 0
    
    for sid in sensor_ids:
        if sid in sensor_map:
            sensor = sensor_map[sid]
            if manager.start_simulator(sensor, interval):
                print(f"  [OK] Lanzado: {sensor.numref} a {interval}s")
                started += 1
            else:
                print(f"  [WARN] Ignorado: {sensor.numref} (Ya en ejecucion)")
        else:
            print(f"  [ERROR] Sensor ID {sid} inexistente")
    
    print(f"\nOperacion finalizada: {started} simulador(es) iniciado(s)")


def create_and_start_sensor_menu():
    """Crea una estructura minima y lanza un sensor con configuracion por defecto"""
    print("\n[+] ARRANQUE RAPIDO IoT")
    print("-" * 40)
    print(f"[INFO] Se creara automaticamente granja/parcela/casilla/sensor a {config.default_interval_seconds}s")

    tipo = "temperatura"
    prefijo = "sim"
    interval = config.default_interval_seconds

    # Generar hashes unicos para evitar colisiones
    unique = uuid.uuid4().hex[:8]
    granja_nombre = f"Sim Granja {unique}"
    parcela_nombre = f"Sim Parcela {unique}"
    numref = f"{prefijo}-{tipo}-{unique}"

    print("\n[INFO] Ejecutando transacciones en API...")
    
    granja = api_client.create_granja(granja_nombre, "sim:auto")
    if granja is None:
        print("[ERROR] Fallo al crear la Granja.")
        return

    parcela = api_client.create_parcela(granja.id, parcela_nombre, tamx=10, tamy=10)
    if parcela is None:
        print("[ERROR] Fallo al crear la Parcela.")
        return

    casilla = api_client.create_casilla(parcela.id, posx=0, posy=0, estado="VACIO")
    if casilla is None:
        print("[ERROR] Fallo al crear la Casilla.")
        return

    sensor = api_client.create_sensor(casilla.id, numref=numref, tipo=tipo, fabricante="IoT Simulator")
    if sensor is None:
        print("[ERROR] Fallo al crear el registro del Sensor.")
        return

    if manager.start_simulator(sensor, interval):
        print(f"[OK] Despliegue exitoso | ID: {sensor.id} | Ref: {sensor.numref} | Freq: {interval}s")
        print(
            f"[INFO] Ubicacion: granja_id={granja.id} ({granja.nombre}) | "
            f"parcela_id={parcela.id} ({parcela.nombre}) | casilla_id={casilla.id}"
        )
    else:
        print("[WARN] Entorno creado, pero el motor de simulacion no pudo iniciar.")


def stop_simulator_menu():
    """Vista interactiva: Detencion de procesos de simulacion"""
    print("\n[X] DETENER SIMULADOR")
    print("-" * 40)
    
    status = manager.get_status()
    
    if not status:
        print("[INFO] No se detectan operaciones activas.")
        return
    
    print("\nOperaciones en curso:")
    for s in status:
        print(f"  [{s['sensor_id']}] {s['numref']} - {s['variable']}")
    
    print("\nComandos:")
    print("  - ID unico (ej: 1)")
    print("  - 'all' para purgar la lista activa")
    print("  - 'q' para cancelar")
    
    choice = input("\n> Comando: ").strip().lower()
    
    if choice == 'q':
        return
    
    if choice == 'all':
        manager.stop_all()
        print("[OK] Todos los hilos finalizados correctamente.")
    else:
        try:
            sensor_id = int(choice)
            if manager.stop_simulator(sensor_id):
                print(f"[OK] Hilo del sensor {sensor_id} finalizado.")
            else:
                print(f"[ERROR] ID {sensor_id} no gestionado actualmente.")
        except ValueError:
            print("[ERROR] Comando no reconocido.")


def show_active_simulators():
    """Vista: Metricas en tiempo real de los procesos en ejecucion"""
    print("\n[I] SIMULADORES ACTIVOS")
    print("-" * 70)
    
    status = manager.get_status()
    
    if not status:
        print("  Sistema en reposo. No hay procesos activos.")
        return
    
    print(f"{'ID':<6} {'NumRef':<15} {'Variable':<18} {'Ultimo':<12} {'Eventos':<10} {'Uptime'}")
    print("-" * 70)
    
    for s in status:
        last_val = f"{s['last_value']:.2f}" if s['last_value'] is not None else "-"
        print(f"{s['sensor_id']:<6} {s['numref']:<15} {s['variable']:<18} {last_val:<12} {s['total_sent']:<10} {s['elapsed']}")
    
    print(f"\nResumen: {len(status)} proceso(s) ejecutandose en background")


def show_config():
    """Vista: Configuraciones actuales del entorno de red"""
    print("\n[C] CONFIGURACION DE ENTORNO")
    print("-" * 40)
    print(f"  Endpoint API: {config.api_base_url}")
    print(f"  Cadencia Standard: {config.default_interval_seconds}s")
    print(f"  Estado de Conexion: {'[OK] En linea' if api_client.health_check() else '[ERROR] Offline'}")


def main():
    """Controlador principal y ciclo de la CLI"""
    clear_screen()
    print_header()
    
    print("\n[INFO] Evaluando conectividad de red...")
    if not api_client.health_check():
        print("[WARN] Imposible establecer conexion con el host:", config.api_base_url)
        print("       Asegurate de que el contenedor de la API este activo.")
        print("       (Modo offline parcial detectado)\n")
    else:
        print("[OK] Enlace con API verificado")
    
    # Bucle infinito del REPL
    while True:
        print_menu()
        
        choice = input("\n> Seleccion: ").strip().lower()
        
        if choice in ['1', 'l']:
            show_sensors()
        elif choice in ['2', '>']:
            start_simulator_menu()
        elif choice in ['3', 'x']:
            stop_simulator_menu()
        elif choice in ['4', 'i']:
            show_active_simulators()
        elif choice in ['5', 'c']:
            show_config()
        elif choice in ['6', '+']:
            create_and_start_sensor_menu()
        elif choice in ['7', 'q']:
            print("\n[INFO] Disparando secuencia de apagado. Limpiando hilos...")
            manager.stop_all()
            time.sleep(0.5)
            print("[INFO] Proceso finalizado. Goodbye.")
            break
        else:
            print("[ERROR] Input no valido, intenta nuevamente.")
        
        input("\n[Presiona Enter para regresar al menu...]")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n[WARN] SIGINT detectado. Ejecutando terminacion segura...")
        manager.stop_all()
        sys.exit(0)
