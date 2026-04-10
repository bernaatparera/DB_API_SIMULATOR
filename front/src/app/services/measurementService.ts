import { MedicionCreate, MedicionRead, ListMedicionesParams } from "../types/measurement";
import { apiRequest } from "./apiClient";

export const getMediciones = async (params: ListMedicionesParams = {}): Promise<MedicionRead[]> => {
  const query = new URLSearchParams();
  if (params.sensor_id !== undefined && params.sensor_id !== null) query.set("sensor_id", String(params.sensor_id));
  if (params.desde) query.set("desde", params.desde);
  if (params.hasta) query.set("hasta", params.hasta);
  if (params.skip !== undefined) query.set("skip", String(params.skip));
  if (params.limit !== undefined) query.set("limit", String(params.limit));

  return apiRequest(`/mediciones/?${query.toString()}`);
};

export const getMedicionById = async (medicion_id: number): Promise<MedicionRead> => {
  return apiRequest(`/mediciones/${medicion_id}`);
};

export const createMedicion = async (data: MedicionCreate): Promise<MedicionRead> => {
  return apiRequest("/mediciones/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
};
