"""
Cliente HTTP para la API de AgroPrecision
"""
import requests
from typing import Optional
from dataclasses import dataclass

from .config import config


@dataclass
class Sensor:
    """Representación de un sensor de la API"""
    id: int
    casilla_id: int
    numref: str
    fabricante: Optional[str]
    tipo: str


class APIClient:
    """Cliente para interactuar con la API de AgroPrecision"""
    
    def __init__(self):
        self.token: Optional[str] = None
        self.session = requests.Session()
    
    @property
    def headers(self) -> dict:
        """Headers con autorización si hay token"""
        h = {"Content-Type": "application/json"}
        if self.token:
            h["Authorization"] = f"Bearer {self.token}"
        return h
    
    def login(self, username: str, password: str) -> bool:
        """
        Autenticarse con la API usando OAuth2 Password Flow
        Retorna True si el login fue exitoso
        """
        try:
            response = self.session.post(
                config.login_url,
                data={"username": username, "password": password},
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("access_token")
                return True
            else:
                return False
                
        except requests.RequestException as e:
            print(f"[ERROR] Error de conexión: {e}")
            return False
    
    def get_sensores(self, limit: int = 100) -> list[Sensor]:
        """Obtener lista de sensores disponibles"""
        try:
            response = self.session.get(
                f"{config.sensores_url}?limit={limit}",
                headers=self.headers
            )
            
            if response.status_code == 200:
                data = response.json()
                return [
                    Sensor(
                        id=s["id"],
                        casilla_id=s["casilla_id"],
                        numref=s["numref"],
                        fabricante=s.get("fabricante"),
                        tipo=s["tipo"]
                    )
                    for s in data
                ]
            elif response.status_code == 401:
                print("[ERROR] No autorizado. Por favor, haz login primero.")
                return []
            else:
                print(f"[ERROR] Error al obtener sensores: {response.status_code}")
                return []
                
        except requests.RequestException as e:
            print(f"[ERROR] Error de conexión: {e}")
            return []
    
    def enviar_medicion(self, sensor_id: int, variable: str, valor: float) -> bool:
        """
        Enviar una medición a la API
        Retorna True si fue exitoso
        """
        try:
            payload = {
                "sensor_id": sensor_id,
                "variable": variable,
                "valor": round(valor, 2)
            }
            
            response = self.session.post(
                config.mediciones_url,
                json=payload,
                headers=self.headers
            )
            
            return response.status_code == 201
            
        except requests.RequestException as e:
            print(f"[ERROR] Error enviando medición: {e}")
            return False
    
    def health_check(self) -> bool:
        """Verificar si la API está disponible"""
        try:
            response = self.session.get(
                f"{config.api_base_url}/health/live",
                timeout=5
            )
            return response.status_code == 200
        except:
            return False


# Cliente global
api_client = APIClient()
