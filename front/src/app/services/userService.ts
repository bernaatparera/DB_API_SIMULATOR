import { UsuarioCreate, UsuarioRead, ListUsuariosParams } from "../types/user";
import { apiRequest } from "./apiClient";

export const getUsuarios = async (params: ListUsuariosParams = {}): Promise<UsuarioRead[]> => {
  const query = new URLSearchParams();
  if (params.activo !== undefined && params.activo !== null) query.set("activo", String(params.activo));
  if (params.skip !== undefined) query.set("skip", String(params.skip));
  if (params.limit !== undefined) query.set("limit", String(params.limit));

  return apiRequest(`/usuarios/?${query.toString()}`);
};

export const getUsuarioById = async (usuario_id: string): Promise<UsuarioRead> => {
  return apiRequest(`/usuarios/${usuario_id}`);
};

export const createUsuario = async (data: UsuarioCreate): Promise<UsuarioRead> => {
  return apiRequest("/usuarios/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
};

// PATCH editar usuario
export const updateUsuario = async (usuario_id: string, data: Partial<UsuarioRead>): Promise<UsuarioRead> => {
  return apiRequest(`/usuarios/${usuario_id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
};

export const changePassword = async (usuario_id: string, newPassword: string): Promise<UsuarioRead> => {
  return apiRequest(`/usuarios/${usuario_id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hash_contrasena: newPassword }),
  });
};
