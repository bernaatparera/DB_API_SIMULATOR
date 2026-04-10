import {
  TipoCultivoCreate, TipoCultivoRead, ListTiposCultivoParams,
  CicloCultivoCreate, CicloCultivoRead, ListCiclosCultivoParams,
} from "../types/crop";
import { apiRequest } from "./apiClient";

// ─── Tipos de Cultivo ────────────────────────────────────────────────────────

export const getTiposCultivo = async (params: ListTiposCultivoParams = {}): Promise<TipoCultivoRead[]> => {
  const query = new URLSearchParams();
  if (params.granja_id !== undefined && params.granja_id !== null) query.set("granja_id", String(params.granja_id));
  if (params.skip !== undefined) query.set("skip", String(params.skip));
  if (params.limit !== undefined) query.set("limit", String(params.limit));

  return apiRequest(`/tipos-cultivo/?${query.toString()}`);
};

export const getTipoCultivoById = async (tipo_cultivo_id: number): Promise<TipoCultivoRead> => {
  return apiRequest(`/tipos-cultivo/${tipo_cultivo_id}`);
};

export const createTipoCultivo = async (data: TipoCultivoCreate): Promise<TipoCultivoRead> => {
  return apiRequest("/tipos-cultivo/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
};

// ─── Ciclos de Cultivo ───────────────────────────────────────────────────────

export const getCiclosCultivo = async (params: ListCiclosCultivoParams = {}): Promise<CicloCultivoRead[]> => {
  const query = new URLSearchParams();
  if (params.casilla_id !== undefined && params.casilla_id !== null) query.set("casilla_id", String(params.casilla_id));
  if (params.tipo_cultivo_id !== undefined && params.tipo_cultivo_id !== null) query.set("tipo_cultivo_id", String(params.tipo_cultivo_id));
  if (params.skip !== undefined) query.set("skip", String(params.skip));
  if (params.limit !== undefined) query.set("limit", String(params.limit));

  return apiRequest(`/ciclos-cultivo/?${query.toString()}`);
};

export const getCicloCultivoById = async (ciclo_id: number): Promise<CicloCultivoRead> => {
  return apiRequest(`/ciclos-cultivo/${ciclo_id}`);
};

export const createCicloCultivo = async (data: CicloCultivoCreate): Promise<CicloCultivoRead> => {
  return apiRequest("/ciclos-cultivo/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
};
