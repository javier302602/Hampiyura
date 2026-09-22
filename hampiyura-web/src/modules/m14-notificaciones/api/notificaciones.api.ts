import { apiRequest } from '../../../shared/api/client';

// Forma real de GET /notificaciones (Notificacion.props en el backend). `entidadTipo`/`entidadId`
// se agregaron recién con M-08 (mismo patrón que ValidacionContenido en M-09) -- por ahora SOLO
// los tipos nuevos "consulta_en_revision"/"consulta_respondida" los traen. Los tipos más viejos
// (comentario_nuevo, calificacion_nueva, contenido_aprobado, etc., de M-06/M-07/M-09) siguen sin
// referencia -- no se retroalimentaron en esta ronda, así que para esos tipos click-para-navegar
// no es posible (limitación real, no un descuido del frontend).
export interface Notificacion {
  id: string;
  usuarioId: string;
  tipo: string;
  mensaje: string;
  leida: boolean;
  fecha: string;
  entidadTipo?: string;
  entidadId?: string;
}

const EVENTO_CAMBIO = 'hampiyura:notificaciones-changed';
// Mismo patrón que session.ts (hampiyura:session-changed): el indicador del Layout y la propia
// NotificacionesPage pueden vivir montados en momentos distintos y necesitan enterarse cuando el
// conteo de no leídas cambia en otra parte, sin tener que compartir estado por props.
function notificarCambio() { try { window.dispatchEvent(new Event(EVENTO_CAMBIO)); } catch { /* SSR o entorno sin window */ } }
export function suscribirseACambiosDeNotificaciones(callback: () => void): () => void {
  window.addEventListener(EVENTO_CAMBIO, callback);
  return () => window.removeEventListener(EVENTO_CAMBIO, callback);
}

// Ya vienen más recientes primero (ORDER BY fecha desc en el repositorio) -- no se reordena aquí.
export async function listarNotificaciones(): Promise<Notificacion[]> {
  const notificaciones = await apiRequest<Notificacion[]>('/notificaciones');
  notificarCambio();
  return notificaciones;
}

export async function marcarTodasLeidas(): Promise<void> {
  await apiRequest<void>('/notificaciones/marcar-leidas', { method: 'PATCH' });
  notificarCambio();
}

export async function marcarLeida(id: string): Promise<void> {
  await apiRequest<void>(`/notificaciones/${id}/marcar-leida`, { method: 'PATCH' });
  notificarCambio();
}

export async function eliminarNotificacion(id: string): Promise<void> {
  await apiRequest<void>(`/notificaciones/${id}`, { method: 'DELETE' });
  notificarCambio();
}
