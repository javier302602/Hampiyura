import { apiRequest } from '../../../shared/api/client';

// Forma real de GET /publicaciones/:publicacionId/comentarios (ComentarioVisible en el backend):
// autorNombre se resuelve en el servidor igual que en publicaciones, para no mostrar un UUID.
export interface Comentario {
  id: string;
  publicacionId: string;
  autorId: string;
  autorNombre: string;
  texto: string;
  fecha: string;
  comentarioPadreId?: string;
}

export function listarComentarios(publicacionId: string): Promise<Comentario[]> {
  return apiRequest<Comentario[]>(`/publicaciones/${publicacionId}/comentarios`);
}
export function comentarPublicacion(publicacionId: string, texto: string, comentarioPadreId?: string): Promise<Comentario> {
  return apiRequest<Comentario>(`/publicaciones/${publicacionId}/comentarios`, { method: 'POST', body: JSON.stringify({ texto, comentarioPadreId }) });
}

export interface Valoracion { id: string; publicacionId: string; autorId: string; estrellas: number; }
export function calificarPublicacion(publicacionId: string, estrellas: number): Promise<Valoracion> {
  return apiRequest<Valoracion>(`/publicaciones/${publicacionId}/calificacion`, { method: 'POST', body: JSON.stringify({ estrellas }) });
}

// Reusa el endpoint genérico de Reporte de FASE 3 (POST /api/reportes) -- no crea un mecanismo
// de moderación paralelo, solo lo llama con tipoEntidad='Comentario'.
export function reportarComentario(comentarioId: string, motivo: string): Promise<void> {
  return apiRequest<void>('/reportes', { method: 'POST', body: JSON.stringify({ tipoEntidad: 'Comentario', entidadId: comentarioId, motivo }) });
}
