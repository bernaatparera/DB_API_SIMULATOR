
export interface CasillaCreate {
  parcela_id: number;
  posx: number;          // >= 0
  posy: number;          // >= 0
  estado?: string;       // default: "VACIO", max 50
}

export interface CasillaRead {
  id: number;
  parcela_id: number;
  posx: number;
  posy: number;
  estado: string;
}

export interface ListCasillasParams {
  parcela_id?: number | null;
  skip?: number;  // default 0
  limit?: number; // default 100, max 1000
}
