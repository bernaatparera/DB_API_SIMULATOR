"""
Configuración del Simulador IoT
"""
from dataclasses import dataclass


@dataclass
class SimulatorConfig:
    """Configuración centralizada del simulador"""
    
    # API Configuration
    api_base_url: str = "http://localhost:8000"
    api_version: str = "v1"
    
    # Simulation defaults
    default_interval_seconds: float = 5.0
    min_interval_seconds: float = 1.0
    max_interval_seconds: float = 60.0
    
    @property
    def api_url(self) -> str:
        return f"{self.api_base_url}/api/{self.api_version}"
    
    @property
    def sensores_url(self) -> str:
        return f"{self.api_url}/sensores"
    
    @property
    def mediciones_url(self) -> str:
        return f"{self.api_url}/mediciones"


# Instancia global de configuración
config = SimulatorConfig()
