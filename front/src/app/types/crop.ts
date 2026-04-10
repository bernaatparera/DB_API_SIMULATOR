
export interface TipoCultivoCreate {
  granja_id: number;
  nombre: string;              // min 1, max 100
  dias_cosecha_est: number;    // > 0
  temp_min_c?: number | null;
  temp_max_c?: number | null;
  hum_suelo_min_pct?: number | null;
  hum_suelo_max_pct?: number | null;
}

export interface TipoCultivoRead {
  id: number;
  granja_id: number;
  nombre: string;
  dias_cosecha_est: number;
  temp_min_c: number | null;
  temp_max_c: number | null;
  hum_suelo_min_pct: number | null;
  hum_suelo_max_pct: number | null;
}

export interface ListTiposCultivoParams {
  granja_id?: number | null;
  skip?: number;  // default 0
  limit?: number; // default 100, max 500
}


export interface CicloCultivoCreate {
  casilla_id: number;
  tipo_cultivo_id: number;
  fecha_siembra?: string | null; // ISO date (YYYY-MM-DD)
  fecha_cosecha?: string | null; // ISO date (YYYY-MM-DD)
  estado?: string;               // default: "CRECIENDO", max 50
}

export interface CicloCultivoRead {
  id: number;
  casilla_id: number;
  tipo_cultivo_id: number;
  fecha_siembra: string | null;
  fecha_cosecha: string | null;
  estado: string;
}

export interface ListCiclosCultivoParams {
  casilla_id?: number | null;
  tipo_cultivo_id?: number | null;
  skip?: number;  // default 0
  limit?: number; // default 100, max 1000
}
