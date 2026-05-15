import { apiRequest } from './apiClient';
import { RegistroManualCreate, RegistroManualRead } from '../types/manualRecord';

export const getRegistrosManuales = async (casilla_id?: number): Promise<RegistroManualRead[]> => {
  const url = casilla_id ? `/registros_manuales/?casilla_id=${casilla_id}` : '/registros_manuales/';
  return apiRequest(url);
};

export const createRegistroManual = async (data: RegistroManualCreate): Promise<RegistroManualRead> => {
  return apiRequest('/registros_manuales/', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

export const deleteRegistroManual = async (id: number): Promise<void> => {
  await apiRequest(`/registros_manuales/${id}`, {
    method: 'DELETE',
  });
};
