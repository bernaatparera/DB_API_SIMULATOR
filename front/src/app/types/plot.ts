
export interface ParcelaCreate {
  granja_id: number;
  nombre: string; // min 1, max 100
  tamx: number;   // > 0
  tamy: number;   // > 0
}

export interface ParcelaRead {
  id: number;
  granja_id: number;
  nombre: string;
  tamx: number;
  tamy: number;
}

export interface ListParcelasParams {
  granja_id?: number | null;
  skip?: number;  // default 0
  limit?: number; // default 100, max 500
}
