import { apiRequest } from '../../../shared/api/client';

// `etiqueta`: texto legible (ej. nombre de la publicación + autor) resuelto por el backend según
// tipoEntidad, en vez de mostrar solo tipoEntidad + un UUID genérico.
export interface ValidacionPendiente {
  id: string;
  tipoEntidad: string;
  entidadId: string;
  estado: string;
  fecha: string;
  autorId: string;
  etiqueta: string;
}

export function listarPendientes(): Promise<ValidacionPendiente[]> { return apiRequest<ValidacionPendiente[]>('/validaciones/pendientes'); }
export function aprobar(id: string): Promise<void> { return apiRequest<void>(`/validaciones/${id}/aprobar`, { method: 'POST' }); }
export function observar(id: string, comentario: string): Promise<void> { return apiRequest<void>(`/validaciones/${id}/observar`, { method: 'POST', body: JSON.stringify({ comentario }) }); }
export function rechazar(id: string, comentario: string): Promise<void> { return apiRequest<void>(`/validaciones/${id}/rechazar`, { method: 'POST', body: JSON.stringify({ comentario }) }); }
