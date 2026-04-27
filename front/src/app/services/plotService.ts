import { ParcelaCreate, ParcelaRead, ListParcelasParams } from "../types/plot";
import { MeasurementsByPlotResponse } from "../types/measurement";
import { apiRequest } from "./apiClient";
import { getMeasurementsByPlot as getMeasurementsByPlotFromMeasurementService } from "./measurementService";

// GET parcelas
export const getParcelas = async (params: ListParcelasParams = {}): Promise<ParcelaRead[]> => {
  const query = new URLSearchParams();
  if (params.granja_id !== undefined && params.granja_id !== null) query.set("granja_id", String(params.granja_id));
  if (params.skip !== undefined) query.set("skip", String(params.skip));
  if (params.limit !== undefined) query.set("limit", String(params.limit));

  return apiRequest(`/parcelas/?${query.toString()}`);
};

// GET por id
export const getParcelaById = async (parcela_id: number): Promise<ParcelaRead> => {
  return apiRequest(`/parcelas/${parcela_id}`);
};

// POST crear
export const createParcela = async (data: ParcelaCreate): Promise<ParcelaRead> => {
  return apiRequest("/parcelas/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
};

// GET mediciones de una parcela
export const getMeasurementsByPlot = async (plotId: number): Promise<MeasurementsByPlotResponse> => {
  return getMeasurementsByPlotFromMeasurementService(plotId);
};

// PATCH editar parcela
export const updateParcela = async (parcela_id: number, data: Partial<ParcelaCreate>): Promise<ParcelaRead> => {
  return apiRequest(`/parcelas/${parcela_id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
};
