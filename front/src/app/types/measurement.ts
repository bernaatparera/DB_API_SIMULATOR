
export interface MedicionCreate {
  sensor_id: number;
  variable: string;       // min 1, max 50
  valor: number;
  dia_hora?: string | null; // ISO date-time, opcional (el back pone now() si no se envía)
}

export interface MedicionRead {
  id: number;
  sensor_id: number;
  variable: string;
  valor: number;
  dia_hora: string; // ISO date-time
}

export interface ListMedicionesParams {
  sensor_id?: number | null;
  desde?: string | null;  // ISO date-time
  hasta?: string | null;  // ISO date-time
  skip?: number;          // default 0
  limit?: number;         // default 100, max 2000
}
