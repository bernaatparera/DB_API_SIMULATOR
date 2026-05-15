import { apiRequest } from './apiClient';
import { RegistroManualCreate, RegistroManualRead } from '../types/manualRecord';

export const getRegistrosManuales = async (casilla_id?: number): Promise<RegistroManualRead[]> => {
  const url = casilla_id ? `/api/v1/registros_manuales/?casilla_id=${casilla_id}` : '/api/v1/registros_manuales/';
  const response = await apiRequest('GET', url);
  return response as RegistroManualRead[];
};

export const createRegistroManual = async (data: RegistroManualCreate): Promise<RegistroManualRead> => {
  const response = await apiRequest('POST', '/api/v1/registros_manuales/', data);
  return response as RegistroManualRead;
};

export const deleteRegistroManual = async (id: number): Promise<void> => {
  await apiRequest('DELETE', `/api/v1/registros_manuales/${id}`);
};
