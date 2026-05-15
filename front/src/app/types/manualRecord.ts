export interface RegistroManualCreate {
  casilla_id: number;
  puntuacion?: number | null;
  descripcion?: string | null;
  imagen_url?: string | null;
}

export interface RegistroManualRead extends RegistroManualCreate {
  id: number;
  usuario_id: string;
  dia_hora: string;
}
