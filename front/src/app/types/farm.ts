export interface Farm {
  id: number;
  nombre: string;
  ubicacion_geo: string | null;
  creado_en: string;
}

export interface FarmDashboardSerie {
  etiqueta: string;
  humedad_media: number | null;
  temperatura_media: number | null;
  mediciones_count: number;
}

export interface FarmDashboardCultivo {
  nombre: string;
  parcelas_count: number;
}

export interface FarmDashboardResumen {
  parcelas_count: number;
  sensores_count: number;
  mediciones_count: number;
  area_total: number;
  humedad_media: number | null;
  temperatura_media: number | null;
  ultima_medicion: string | null;
}

export interface FarmDashboardData {
  resumen: FarmDashboardResumen;
  series: FarmDashboardSerie[];
  distribucion_cultivos: FarmDashboardCultivo[];
}

// request para crear
export interface CreateFarmRequest {
  nombre: string;
  ubicacion_geo?: string | null;
}
