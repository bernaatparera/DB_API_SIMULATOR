
export interface SensorCreate {
  casilla_id: number;
  numref: string;             // min 1, max 100
  fabricante?: string | null; // max 150
  tipo: string;               // min 1, max 50
}

export interface SensorRead {
  id: number;
  casilla_id: number;
  numref: string;
  fabricante: string | null;
  tipo: string;
}

export interface ListSensoresParams {
  casilla_id?: number | null;
  skip?: number;  // default 0
  limit?: number; // default 100, max 1000
}
