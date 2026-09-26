import { randomUUID } from 'crypto';
import { Notificacion } from '../../../../domain/entities/notificacion.entity';
import { NotificadorPort, ReferenciaNotificacion } from '../../../../domain/ports/out/notificador.port';
import { NotificacionRepositoryPort } from '../../../../domain/ports/out/notificacion.repository.port';

// Reemplaza a ConsoleNotificador (que en realidad no hacía nada, ni siquiera loguear) como
// implementación por defecto. Persiste en la tabla Notificacion para que el centro de
// notificaciones (RF-56/195) tenga qué mostrar. Un adapter de email/push real (SMTP, Firebase...)
// queda fuera de esta fase por falta de credenciales/infraestructura de terceros -- ver resumen.
const MENSAJES_POR_TIPO: Record<string, string> = {
  contenido_aprobado: 'Tu contenido fue aprobado y ya es visible públicamente.',
  contenido_observado: 'Tu contenido recibió observaciones de un especialista; revísalo.',
  contenido_rechazado: 'Tu contenido fue rechazado por un especialista.',
  comentario_nuevo: 'Tu publicación recibió un comentario nuevo.',
  respuesta_comentario: 'Tu comentario recibió una respuesta.',
  publicacion_eliminada_moderacion: 'Tu publicación fue eliminada por el equipo de moderación.',
  calificacion_nueva: 'Tu publicación recibió una nueva calificación.',
  // M-08 (RF-263 criterio de aceptación): el equipo tomó/respondió tu consulta.
  consulta_en_revision: 'Tu consulta fue tomada en revisión por el equipo.',
  consulta_respondida: 'Tu consulta fue respondida por el equipo.',
  // M-15: un administrador resolvió tu comprobante de pago.
  pago_confirmado: 'Tu pago fue confirmado: ya puedes ver los contactos que incluye tu plan.',
  pago_rechazado: 'Tu comprobante de pago fue rechazado; revisa el motivo en Mis planes y vuelve a intentarlo.',
};
function mensajePara(tipo: string): string { return MENSAJES_POR_TIPO[tipo] ?? `Tienes una notificación nueva: ${tipo}`; }

export class PersistenteNotificadorAdapter implements NotificadorPort {
  constructor(private readonly repo: NotificacionRepositoryPort) {}
  async notificar(usuarioId: string, tipo: string, referencia?: ReferenciaNotificacion): Promise<void> {
    await this.repo.guardar(new Notificacion({ id: randomUUID(), usuarioId, tipo, mensaje: mensajePara(tipo), leida: false, fecha: new Date(), entidadTipo: referencia?.entidadTipo, entidadId: referencia?.entidadId }));
  }
}
