"""
Generadores de datos para diferentes tipos de sensores IoT
"""
import random
import math
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Dict, Type


class SensorGenerator(ABC):
    """Clase base para generadores de datos de sensores"""
    
    def __init__(self):
        self.last_value: float = self._initial_value()
        self.readings_count: int = 0
    
    @property
    @abstractmethod
    def variable_name(self) -> str:
        """Nombre de la variable que mide (para la API)"""
        pass
    
    @property
    @abstractmethod
    def unit(self) -> str:
        """Unidad de medida"""
        pass
    
    @abstractmethod
    def _initial_value(self) -> float:
        """Valor inicial del sensor"""
        pass
    
    @abstractmethod
    def _generate_next(self) -> float:
        """Generar siguiente valor"""
        pass
    
    def read(self) -> float:
        """Leer el siguiente valor del sensor"""
        self.last_value = self._generate_next()
        self.readings_count += 1
        return round(self.last_value, 2)
    
    def format_value(self, value: float) -> str:
        """Formatear valor con unidad"""
        return f"{value} {self.unit}"


class TemperaturaAireGenerator(SensorGenerator):
    """Genera datos de temperatura del aire (15-35°C)"""
    
    variable_name = "temperatura_aire"
    unit = "°C"
    
    def _initial_value(self) -> float:
        return random.uniform(20, 25)
    
    def _generate_next(self) -> float:
        # Variación basada en hora del día
        hour = datetime.now().hour
        
        # Base temperature varies with time of day
        if 6 <= hour < 12:
            # Mañana: subiendo
            base_delta = 0.3
        elif 12 <= hour < 18:
            # Tarde: alta y estable
            base_delta = 0.1
        elif 18 <= hour < 22:
            # Noche: bajando
            base_delta = -0.2
        else:
            # Madrugada: baja y estable
            base_delta = -0.1
        
        # Random walk con tendencia
        delta = base_delta + random.gauss(0, 0.5)
        new_value = self.last_value + delta
        
        # Clamp entre 15 y 35
        return max(15.0, min(35.0, new_value))


class HumedadSueloGenerator(SensorGenerator):
    """Genera datos de humedad del suelo (40-90%)"""
    
    variable_name = "humedad_suelo"
    unit = "%"
    
    def _initial_value(self) -> float:
        return random.uniform(60, 75)
    
    def _generate_next(self) -> float:
        # La humedad tiende a bajar gradualmente (evaporación)
        evaporation = random.uniform(0.1, 0.5)
        
        # Ocasionalmente hay "riego" que aumenta humedad
        if random.random() < 0.05:  # 5% chance de riego
            irrigation = random.uniform(5, 15)
            delta = irrigation - evaporation
        else:
            delta = -evaporation
        
        # Pequeña variación aleatoria
        delta += random.gauss(0, 0.3)
        
        new_value = self.last_value + delta
        return max(40.0, min(90.0, new_value))


class CO2Generator(SensorGenerator):
    """Genera datos de CO2 (300-600 ppm)"""
    
    variable_name = "co2"
    unit = "ppm"
    
    def _initial_value(self) -> float:
        return random.uniform(380, 420)
    
    def _generate_next(self) -> float:
        # CO2 tiene variaciones pequeñas
        delta = random.gauss(0, 5)
        
        # Tendencia a volver al equilibrio (~400 ppm)
        equilibrium_pull = (400 - self.last_value) * 0.05
        
        new_value = self.last_value + delta + equilibrium_pull
        return max(300.0, min(600.0, new_value))


class LuminosidadGenerator(SensorGenerator):
    """Genera datos de luminosidad (0-100000 lux)"""
    
    variable_name = "luminosidad"
    unit = "lux"
    
    def _initial_value(self) -> float:
        hour = datetime.now().hour
        return self._base_for_hour(hour)
    
    def _base_for_hour(self, hour: int) -> float:
        """Luminosidad base según hora del día"""
        if 6 <= hour < 8:
            return random.uniform(5000, 20000)
        elif 8 <= hour < 10:
            return random.uniform(20000, 50000)
        elif 10 <= hour < 16:
            return random.uniform(50000, 100000)
        elif 16 <= hour < 18:
            return random.uniform(20000, 50000)
        elif 18 <= hour < 20:
            return random.uniform(1000, 10000)
        else:
            return random.uniform(0, 100)
    
    def _generate_next(self) -> float:
        hour = datetime.now().hour
        target = self._base_for_hour(hour)
        
        # Suavizar hacia el target
        smoothing = 0.1
        new_value = self.last_value + (target - self.last_value) * smoothing
        
        # Añadir variación (nubes, sombras)
        cloud_effect = random.gauss(0, new_value * 0.1)
        new_value += cloud_effect
        
        return max(0.0, min(100000.0, new_value))


class HumedadAireGenerator(SensorGenerator):
    """Genera datos de humedad del aire (30-95%)"""
    
    variable_name = "humedad_aire"
    unit = "%"
    
    def _initial_value(self) -> float:
        return random.uniform(50, 70)
    
    def _generate_next(self) -> float:
        hour = datetime.now().hour
        
        # Humedad tiende a ser más alta por la noche
        if 6 <= hour < 12:
            target = 55
        elif 12 <= hour < 18:
            target = 45
        else:
            target = 70
        
        # Suavizar hacia target
        delta = (target - self.last_value) * 0.1 + random.gauss(0, 2)
        
        new_value = self.last_value + delta
        return max(30.0, min(95.0, new_value))


# Mapeo de tipos de sensor a generadores
SENSOR_GENERATORS: Dict[str, Type[SensorGenerator]] = {
    "temperatura": TemperaturaAireGenerator,
    "temperatura_aire": TemperaturaAireGenerator,
    "humedad": HumedadSueloGenerator,
    "humedad_suelo": HumedadSueloGenerator,
    "humedad_aire": HumedadAireGenerator,
    "co2": CO2Generator,
    "luminosidad": LuminosidadGenerator,
    "luz": LuminosidadGenerator,
}


def get_generator_for_sensor_type(sensor_type: str) -> SensorGenerator:
    """
    Obtiene el generador apropiado para un tipo de sensor.
    Si no existe, usa temperatura como default.
    """
    sensor_type_lower = sensor_type.lower()
    
    for key, generator_class in SENSOR_GENERATORS.items():
        if key in sensor_type_lower:
            return generator_class()
    
    # Default: temperatura
    print(f"[WARN] Tipo de sensor '{sensor_type}' no reconocido, usando temperatura")
    return TemperaturaAireGenerator()
