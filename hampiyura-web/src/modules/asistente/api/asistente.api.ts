import { apiRequest } from '../../../shared/api/client';

export interface EstadoAsistente { activo: boolean; simulado: boolean }
export interface MensajeHistorial { rol: 'user' | 'assistant'; contenido: string }
export interface RespuestaAsistente {
  respuesta: string;
  escalar: boolean;            // true = ofrecer con énfasis "Enviar mi pregunta a un especialista"
  consultaSugerida: string;    // texto para precargar en "Enviar consulta"
  fuentes: { planta: string; tipos: string[] }[];
  modo: 'real' | 'simulado' | 'sin-modelo';
}

export function estadoAsistente(): Promise<EstadoAsistente> { return apiRequest<EstadoAsistente>('/asistente/estado'); }
export function consultarAsistente(mensaje: string, historial: MensajeHistorial[]): Promise<RespuestaAsistente> {
  return apiRequest<RespuestaAsistente>('/asistente/consulta', { method: 'POST', body: JSON.stringify({ mensaje, historial }) });
}
