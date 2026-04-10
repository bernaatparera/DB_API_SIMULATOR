import { ParcelaCreate, ParcelaRead, ListParcelasParams } from "../types/plot";
import { apiRequest } from "./apiClient";

export const getParcelas = async (params: ListParcelasParams = {}): Promise<ParcelaRead[]> => {
  const query = new URLSearchParams();
  if (params.granja_id !== undefined && params.granja_id !== null) query.set("granja_id", String(params.granja_id));
  if (params.skip !== undefined) query.set("skip", String(params.skip));
  if (params.limit !== undefined) query.set("limit", String(params.limit));

  return apiRequest(`/parcelas/?${query.toString()}`);
};

export const getParcelaById = async (parcela_id: number): Promise<ParcelaRead> => {
  return apiRequest(`/parcelas/${parcela_id}`);
};

export const createParcela = async (data: ParcelaCreate): Promise<ParcelaRead> => {
  return apiRequest("/parcelas/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
};
