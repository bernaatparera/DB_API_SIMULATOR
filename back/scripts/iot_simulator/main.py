#!/usr/bin/env python3
"""
Simulador IoT Interactivo para AgroPrecision
CLI principal con menú interactivo para gestionar sensores simulados
"""
import os
import sys
import time
import threading
from datetime import datetime
from typing import Dict, Optional
from dataclasses import dataclass

# Añadir el directorio raíz al path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from scripts.iot_simulator.config import config
from scripts.iot_simulator.api_client import api_client, Sensor
from scripts.iot_simulator.sensors import get_generator_for_sensor_type, SensorGenerator


@dataclass
class ActiveSimulator:
    """Representa un simulador activo"""
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
    """Gestor de simuladores activos"""
    
    def __init__(self):
        self.active_simulators: Dict[int, ActiveSimulator] = {}
        self._lock = threading.Lock()
    
    def start_simulator(self, sensor: Sensor, interval: float) -> bool:
        """Inicia un simulador para un sensor"""
        if sensor.id in self.active_simulators:
            print(f"[WARN] El sensor {sensor.id} ya está siendo simulado")
            return False
        
        generator = get_generator_for_sensor_type(sensor.tipo)
        
        sim = ActiveSimulator(
            sensor=sensor,
            generator=generator,
            interval=interval,
            thread=None,  # Se asigna después
            running=True,
            started_at=datetime.now()
        )
        
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
        """Loop principal de simulación para un sensor"""
        while True:
            with self._lock:
                sim = self.active_simulators.get(sensor_id)
                if sim is None or not sim.running:
                    break
            
            # Generar y enviar medición
            value = sim.generator.read()
            variable = sim.generator.variable_name
            
            success = api_client.enviar_medicion(sensor_id, variable, value)
            
            with self._lock:
                sim = self.active_simulators.get(sensor_id)
                if sim:
                    sim.last_value = value
                    sim.last_sent_at = datetime.now()
                    if success:
                        sim.total_sent += 1
            
            time.sleep(sim.interval)
    
    def stop_simulator(self, sensor_id: int) -> bool:
        """Detiene un simulador específico"""
        with self._lock:
            sim = self.active_simulators.get(sensor_id)
            if sim:
                sim.running = False
                del self.active_simulators[sensor_id]
                return True
        return False
    
    def stop_all(self):
        """Detiene todos los simuladores"""
        with self._lock:
            for sim in self.active_simulators.values():
                sim.running = False
            self.active_simulators.clear()
    
    def get_status(self) -> list[dict]:
        """Obtiene el estado de todos los simuladores activos"""
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
                    "elapsed": str(elapsed).split('.')[0]  # Sin microsegundos
                })
        return status


# Gestor global
manager = SimulatorManager()


def clear_screen():
    """Limpia la pantalla de la terminal"""
    os.system('cls' if os.name == 'nt' else 'clear')


def print_header():
    """Imprime el header del simulador"""
    print("\n" + "=" * 55)
    print("    🌱 SIMULADOR IoT - AgroPrecision")
    print("=" * 55)


def print_menu():
    """Imprime el menú principal"""
    print("\n┌─────────────────────────────────────────────────────┐")
    print("│                   MENÚ PRINCIPAL                    │")
    print("├─────────────────────────────────────────────────────┤")
    print("│  1. 📋 Ver sensores disponibles                     │")
    print("│  2. ▶️  Iniciar simulador                            │")
    print("│  3. ⏹️  Detener simulador                            │")
    print("│  4. 👁️  Ver simuladores activos                      │")
    print("│  5. ⚙️  Configuración                                 │")
    print("│  6. 🔐 Login (cambiar credenciales)                  │")
    print("│  7. 🚪 Salir                                         │")
    print("└─────────────────────────────────────────────────────┘")


def show_sensors():
    """Muestra los sensores disponibles en la API"""
    print("\n📋 SENSORES DISPONIBLES")
    print("-" * 60)
    
    sensores = api_client.get_sensores()
    
    if not sensores:
        print("  No hay sensores disponibles o no estás autenticado.")
        print("  Usa la opción 6 para hacer login.")
        return
    
    # Marcar cuáles están siendo simulados
    active_ids = set(manager.active_simulators.keys())
    
    print(f"{'ID':<6} {'NumRef':<20} {'Tipo':<15} {'Casilla':<10} {'Estado'}")
    print("-" * 60)
    
    for s in sensores:
        status = "🟢 Simulando" if s.id in active_ids else "⚪ Inactivo"
        print(f"{s.id:<6} {s.numref:<20} {s.tipo:<15} {s.casilla_id:<10} {status}")
    
    print(f"\nTotal: {len(sensores)} sensor(es)")


def start_simulator_menu():
    """Menú para iniciar un simulador"""
    print("\n▶️  INICIAR SIMULADOR")
    print("-" * 40)
    
    sensores = api_client.get_sensores()
    
    if not sensores:
        print("No hay sensores disponibles.")
        return
    
    # Mostrar sensores disponibles
    print("\nSensores disponibles:")
    for s in sensores:
        if s.id not in manager.active_simulators:
            print(f"  [{s.id}] {s.numref} - {s.tipo}")
    
    print("\nOpciones:")
    print("  - Escribe ID del sensor (ej: 1)")
    print("  - Escribe varios IDs separados por coma (ej: 1,2,3)")
    print("  - Escribe 'all' para todos los inactivos")
    print("  - Escribe 'q' para cancelar")
    
    choice = input("\n> ").strip().lower()
    
    if choice == 'q':
        return
    
    # Determinar qué sensores activar
    sensor_ids = []
    
    if choice == 'all':
        sensor_ids = [s.id for s in sensores if s.id not in manager.active_simulators]
    else:
        try:
            sensor_ids = [int(x.strip()) for x in choice.split(',')]
        except ValueError:
            print("[ERROR] IDs inválidos")
            return
    
    # Pedir intervalo
    interval_str = input(f"\nIntervalo en segundos [{config.default_interval_seconds}]: ").strip()
    try:
        interval = float(interval_str) if interval_str else config.default_interval_seconds
        interval = max(config.min_interval_seconds, min(config.max_interval_seconds, interval))
    except ValueError:
        interval = config.default_interval_seconds
    
    # Mapear IDs a sensores
    sensor_map = {s.id: s for s in sensores}
    
    # Iniciar simuladores
    started = 0
    for sid in sensor_ids:
        if sid in sensor_map:
            sensor = sensor_map[sid]
            if manager.start_simulator(sensor, interval):
                print(f"  ✅ Iniciado: {sensor.numref} (intervalo: {interval}s)")
                started += 1
            else:
                print(f"  ⚠️  {sensor.numref} ya está activo")
        else:
            print(f"  ❌ Sensor ID {sid} no encontrado")
    
    print(f"\n{started} simulador(es) iniciado(s)")


def stop_simulator_menu():
    """Menú para detener simuladores"""
    print("\n⏹️  DETENER SIMULADOR")
    print("-" * 40)
    
    status = manager.get_status()
    
    if not status:
        print("No hay simuladores activos.")
        return
    
    print("\nSimuladores activos:")
    for s in status:
        print(f"  [{s['sensor_id']}] {s['numref']} - {s['variable']}")
    
    print("\nOpciones:")
    print("  - Escribe ID del sensor (ej: 1)")
    print("  - Escribe 'all' para detener todos")
    print("  - Escribe 'q' para cancelar")
    
    choice = input("\n> ").strip().lower()
    
    if choice == 'q':
        return
    
    if choice == 'all':
        manager.stop_all()
        print("✅ Todos los simuladores detenidos")
    else:
        try:
            sensor_id = int(choice)
            if manager.stop_simulator(sensor_id):
                print(f"✅ Simulador {sensor_id} detenido")
            else:
                print(f"❌ Simulador {sensor_id} no encontrado")
        except ValueError:
            print("[ERROR] ID inválido")


def show_active_simulators():
    """Muestra el estado de los simuladores activos"""
    print("\n👁️  SIMULADORES ACTIVOS")
    print("-" * 70)
    
    status = manager.get_status()
    
    if not status:
        print("  No hay simuladores activos.")
        return
    
    print(f"{'ID':<6} {'NumRef':<15} {'Variable':<18} {'Último':<12} {'Enviados':<10} {'Tiempo'}")
    print("-" * 70)
    
    for s in status:
        last_val = f"{s['last_value']:.2f}" if s['last_value'] is not None else "-"
        print(f"{s['sensor_id']:<6} {s['numref']:<15} {s['variable']:<18} {last_val:<12} {s['total_sent']:<10} {s['elapsed']}")
    
    print(f"\nTotal: {len(status)} simulador(es) activo(s)")


def show_config():
    """Muestra y permite editar la configuración"""
    print("\n⚙️  CONFIGURACIÓN")
    print("-" * 40)
    print(f"  API URL: {config.api_base_url}")
    print(f"  Usuario: {config.username}")
    print(f"  Intervalo por defecto: {config.default_interval_seconds}s")
    print(f"  Autenticado: {'✅ Sí' if api_client.token else '❌ No'}")
    print(f"  API disponible: {'✅ Sí' if api_client.health_check() else '❌ No'}")


def do_login():
    """Realiza login con credenciales"""
    print("\n🔐 LOGIN")
    print("-" * 40)
    
    username = input(f"Usuario [{config.username}]: ").strip()
    username = username if username else config.username
    
    password = input("Contraseña: ").strip()
    if not password:
        password = config.password
    
    print("\nConectando...")
    
    if api_client.login(username, password):
        print("✅ Login exitoso!")
        config.username = username
        config.password = password
    else:
        print("❌ Login fallido. Verifica las credenciales.")


def main():
    """Función principal del simulador"""
    clear_screen()
    print_header()
    
    # Verificar conexión
    print("\n🔍 Verificando conexión con la API...")
    if not api_client.health_check():
        print("⚠️  No se puede conectar a la API en", config.api_base_url)
        print("   Asegúrate de que la API esté corriendo.")
        print("   Puedes continuar e intentar conectar más tarde.\n")
    else:
        print("✅ API disponible")
        
        # Intentar login automático
        print("🔐 Intentando login automático...")
        if api_client.login(config.username, config.password):
            print(f"✅ Autenticado como: {config.username}")
        else:
            print("⚠️  Login automático fallido. Usa la opción 6 para autenticarte.")
    
    # Loop principal
    while True:
        print_menu()
        
        choice = input("\n> Selecciona una opción: ").strip()
        
        if choice == '1':
            show_sensors()
        elif choice == '2':
            start_simulator_menu()
        elif choice == '3':
            stop_simulator_menu()
        elif choice == '4':
            show_active_simulators()
        elif choice == '5':
            show_config()
        elif choice == '6':
            do_login()
        elif choice == '7':
            print("\n👋 Deteniendo simuladores y saliendo...")
            manager.stop_all()
            time.sleep(0.5)
            print("¡Hasta luego!")
            break
        else:
            print("❌ Opción no válida")
        
        input("\n[Presiona Enter para continuar...]")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n👋 Interrupción detectada. Saliendo...")
        manager.stop_all()
        sys.exit(0)
