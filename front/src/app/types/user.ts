 
export interface UsuarioCreate {
  email: string;
  nombre: string;
  apellidos: string;
  activo?: boolean; // default: true
  hash_contrasena: string;
}
 
export interface UsuarioRead {
  id: string; // uuid
  email: string;
  nombre: string;
  apellidos: string;
  activo: boolean;
  creado_en: string; // ISO date-time
}
 
export interface ListUsuariosParams {
  activo?: boolean | null;
  skip?: number; // default 0
  limit?: number; // default 100, max 500
}