import { CasillaCreate, CasillaRead, ListCasillasParams } from "../types/cell";
import { apiRequest } from "./apiClient";

export const getCasillas = async (params: ListCasillasParams = {}): Promise<CasillaRead[]> => {
  const query = new URLSearchParams();
  if (params.parcela_id !== undefined && params.parcela_id !== null) query.set("parcela_id", String(params.parcela_id));
  if (params.skip !== undefined) query.set("skip", String(params.skip));
  if (params.limit !== undefined) query.set("limit", String(params.limit));

  return apiRequest(`/casillas/?${query.toString()}`);
};

export const getCasillaById = async (casilla_id: number): Promise<CasillaRead> => {
  return apiRequest(`/casillas/${casilla_id}`);
};

export const createCasilla = async (data: CasillaCreate): Promise<CasillaRead> => {
  return apiRequest("/casillas/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
};
