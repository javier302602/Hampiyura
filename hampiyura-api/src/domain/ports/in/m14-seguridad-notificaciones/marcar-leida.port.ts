// Marca UNA notificación como leída (a diferencia de MarcarTodasLeidasPort, que las marca todas).
// No estaba construido en FASE 7 -- se agrega ahora porque el centro de notificaciones lo necesita
// para poder marcar una notificación individual al hacer clic en ella (mismo patrón de seguridad
// que EliminarNotificacionPort: solo afecta la notificación si pertenece al propio usuario).
export interface MarcarLeidaPort { ejecutar(id: string, usuarioId: string): Promise<void>; }
