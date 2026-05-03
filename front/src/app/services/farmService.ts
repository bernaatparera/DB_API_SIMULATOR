import { Farm, CreateFarmRequest, FarmDashboardData } from "../types/farm";
import { apiRequest } from "./apiClient";

// GET listado
export const getFarms = async (): Promise<Farm[]> => {
  return apiRequest("/granjas");
};

// GET por id
export const getFarmById = async (id: string): Promise<Farm> => {
  return apiRequest(`/granjas/${id}`);
};

export const getFarmDashboard = async (id: string): Promise<FarmDashboardData> => {
  return apiRequest(`/granjas/${id}/dashboard`);
};

// POST crear
export const createFarm = async (data: CreateFarmRequest): Promise<Farm> => {
  return apiRequest("/granjas", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
};

// PATCH editar granja
export const updateFarm = async (id: number, data: Partial<CreateFarmRequest>): Promise<Farm> => {
  return apiRequest(`/granjas/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
};

// DELETE eliminar granja
export const deleteFarm = async (id: number): Promise<{ message: string }> => {
  return apiRequest(`/granjas/${id}`, {
    method: "DELETE",
  });
};
