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


@dataclass
class Granja:
    id: int
    nombre: str


@dataclass
class Parcela:
    id: int
    granja_id: int
    nombre: str
    tamx: int
    tamy: int


@dataclass
class Casilla:
    id: int
    parcela_id: int
    posx: int
    posy: int
    estado: str


class APIClient:
    """Cliente para interactuar con la API de AgroPrecision"""
    
    def __init__(self):
        self.session = requests.Session()
    
    @property
    def headers(self) -> dict:
        """Headers por defecto para peticiones JSON"""
        return {"Content-Type": "application/json"}
    
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
                print("[ERROR] 401 en /sensores: la API que está corriendo aún exige JWT.")
                print("[INFO] Reinicia el servicio API para cargar los cambios sin auth IoT.")
                return []
            else:
                detail = response.text[:200].replace("\n", " ")
                print(f"[ERROR] Error al obtener sensores: {response.status_code} - {detail}")
                return []
                
        except requests.RequestException as e:
            print(f"[ERROR] Error de conexión: {e}")
            return []

    def create_granja(self, nombre: str, ubicacion_geo: str | None = None) -> Optional[Granja]:
        try:
            response = self.session.post(
                f"{config.api_url}/granjas",
                json={"nombre": nombre, "ubicacion_geo": ubicacion_geo},
                headers=self.headers,
            )
            if response.status_code == 201:
                data = response.json()
                return Granja(id=data["id"], nombre=data["nombre"])
            detail = response.text[:200].replace("\n", " ")
            print(f"[ERROR] Error creando granja: {response.status_code} - {detail}")
            return None
        except requests.RequestException as e:
            print(f"[ERROR] Error de conexión creando granja: {e}")
            return None

    def create_parcela(self, granja_id: int, nombre: str, tamx: int = 10, tamy: int = 10) -> Optional[Parcela]:
        try:
            response = self.session.post(
                f"{config.api_url}/parcelas",
                json={"granja_id": granja_id, "nombre": nombre, "tamx": tamx, "tamy": tamy},
                headers=self.headers,
            )
            if response.status_code == 201:
                data = response.json()
                return Parcela(
                    id=data["id"],
                    granja_id=data["granja_id"],
                    nombre=data["nombre"],
                    tamx=data["tamx"],
                    tamy=data["tamy"],
                )
            detail = response.text[:200].replace("\n", " ")
            print(f"[ERROR] Error creando parcela: {response.status_code} - {detail}")
            return None
        except requests.RequestException as e:
            print(f"[ERROR] Error de conexión creando parcela: {e}")
            return None

    def create_casilla(self, parcela_id: int, posx: int = 0, posy: int = 0, estado: str = "VACIO") -> Optional[Casilla]:
        try:
            response = self.session.post(
                f"{config.api_url}/casillas",
                json={"parcela_id": parcela_id, "posx": posx, "posy": posy, "estado": estado},
                headers=self.headers,
            )
            if response.status_code == 201:
                data = response.json()
                return Casilla(
                    id=data["id"],
                    parcela_id=data["parcela_id"],
                    posx=data["posx"],
                    posy=data["posy"],
                    estado=data["estado"],
                )
            detail = response.text[:200].replace("\n", " ")
            print(f"[ERROR] Error creando casilla: {response.status_code} - {detail}")
            return None
        except requests.RequestException as e:
            print(f"[ERROR] Error de conexión creando casilla: {e}")
            return None

    def create_sensor(self, casilla_id: int, numref: str, tipo: str, fabricante: str = "IoT Simulator") -> Optional[Sensor]:
        try:
            response = self.session.post(
                config.sensores_url,
                json={"casilla_id": casilla_id, "numref": numref, "fabricante": fabricante, "tipo": tipo},
                headers=self.headers,
            )
            if response.status_code == 201:
                data = response.json()
                return Sensor(
                    id=data["id"],
                    casilla_id=data["casilla_id"],
                    numref=data["numref"],
                    fabricante=data.get("fabricante"),
                    tipo=data["tipo"],
                )
            detail = response.text[:200].replace("\n", " ")
            print(f"[ERROR] Error creando sensor: {response.status_code} - {detail}")
            return None
        except requests.RequestException as e:
            print(f"[ERROR] Error de conexión creando sensor: {e}")
            return None
    
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
            if response.status_code == 201:
                return True
            if response.status_code == 401:
                print("[ERROR] 401 en /mediciones: la API que está corriendo aún exige JWT.")
                return False
            detail = response.text[:200].replace("\n", " ")
            print(f"[ERROR] Error enviando medición: {response.status_code} - {detail}")
            return False
            
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
