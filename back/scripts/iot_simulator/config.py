"""
Configuración del Simulador IoT
"""
import os
from dataclasses import dataclass, field


@dataclass
class SimulatorConfig:
    """Configuración centralizada del simulador"""
    
    # API Configuration
    api_base_url: str = "http://localhost:8000"
    api_version: str = "v1"
    
    # Auth (se pueden sobreescribir con variables de entorno)
    username: str = field(default_factory=lambda: os.getenv("IOT_USERNAME", "iot@agroprecision.com"))
    password: str = field(default_factory=lambda: os.getenv("IOT_PASSWORD", "iot12345678"))
    
    # Simulation defaults
    default_interval_seconds: float = 5.0
    min_interval_seconds: float = 1.0
    max_interval_seconds: float = 60.0
    
    @property
    def api_url(self) -> str:
        return f"{self.api_base_url}/api/{self.api_version}"
    
    @property
    def login_url(self) -> str:
        return f"{self.api_url}/auth/login"
    
    @property
    def sensores_url(self) -> str:
        return f"{self.api_url}/sensores"
    
    @property
    def mediciones_url(self) -> str:
        return f"{self.api_url}/mediciones"


# Instancia global de configuración
config = SimulatorConfig()
