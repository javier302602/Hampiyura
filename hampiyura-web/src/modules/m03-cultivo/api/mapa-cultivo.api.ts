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
  // El mapa público solo trae 'Validado'; las demás llegan solo en la vista de gestión.
  estadoValidacion: string;
}

// `incluirNoValidadas` (solo tiene efecto para Especialista/Administrador): vista de gestión.
export function listarMapaCultivo(incluirNoValidadas = false): Promise<UbicacionCultivoVisible[]> {
  return apiRequest<UbicacionCultivoVisible[]>(incluirNoValidadas ? '/mapa-cultivo?estado=todas' : '/mapa-cultivo');
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
