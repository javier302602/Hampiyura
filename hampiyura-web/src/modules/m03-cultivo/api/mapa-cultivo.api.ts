import { apiRequest } from '../../../shared/api/client';

// RF-271: vista pública del mapa de distribución. `latitud`/`longitud` llegan en null cuando la
// planta está actualmente en riesgo de conservación (RN-07) -- el backend nunca las expone en ese
// caso, ni siquiera si quedaron guardadas de antes; en ese caso solo hay `zona` (texto amplio).
export interface UbicacionCultivoVisible {
  id: string;
  cultivoId: string;
  plantaId: string;
  nombreComunPlanta: string;
  familia: string;
  tipoCultivo: string;
  zona: string;
  latitud: number | null;
  longitud: number | null;
  fecha: string;
  autorNombre: string;
}

export function listarMapaCultivo(): Promise<UbicacionCultivoVisible[]> {
  return apiRequest<UbicacionCultivoVisible[]>('/mapa-cultivo');
}

export interface RegistrarUbicacionCultivoInput {
  zona: string;
  latitud?: number;
  longitud?: number;
}
export interface UbicacionCultivoProps {
  id: string;
  cultivoId: string;
  plantaId: string;
  autorId: string;
  zona: string;
  latitud: number | null;
  longitud: number | null;
  fecha: string;
}
export function registrarUbicacionCultivo(cultivoId: string, input: RegistrarUbicacionCultivoInput): Promise<UbicacionCultivoProps> {
  return apiRequest<UbicacionCultivoProps>(`/cultivos/${cultivoId}/ubicacion`, { method: 'POST', body: JSON.stringify(input) });
}
