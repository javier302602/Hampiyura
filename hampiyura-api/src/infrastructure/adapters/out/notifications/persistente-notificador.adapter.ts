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
  validacion_cientifica_registrada: 'Un uso que propusiste fue validado científicamente por el equipo y ya se muestra como verificado.',
  // M-15: un administrador resolvió tu comprobante de pago.
  pago_confirmado: 'Tu pago fue confirmado: ya puedes ver los contactos que incluye tu plan.',
  // Ronda 30: mensajería directa (plan Negocio) y alertas de seguimiento de plantas.
  mensaje_directo: 'Tienes un mensaje nuevo en Mensajes.',
  alerta_disponibilidad: 'Hay productos disponibles de una planta que sigues.',
  alerta_temporada: 'Una planta que sigues está en su época de cosecha.',
  // Ronda 35 · M-16: pedidos de compra directa (el texto con el producto y el monto va en cada aviso).
  pedido_nuevo: 'Tienes un pedido nuevo.', pedido_pago_informado: 'Un comprador subió su comprobante de pago.', pedido_pago_confirmado: 'El vendedor confirmó tu pago.',
  pedido_pago_rechazado: 'El vendedor no pudo confirmar tu pago.', pedido_enviado: 'Tu pedido fue enviado.', pedido_recibido: 'El comprador confirmó la recepción.',
  pedido_reclamo: 'Un comprador abrió un reclamo.', pedido_reclamo_cerrado: 'Un reclamo fue cerrado.', pedido_cancelado: 'Un pedido fue cancelado.',
  pago_rechazado: 'Tu comprobante de pago fue rechazado; revisa el motivo en Mis planes y vuelve a intentarlo.',
};
function mensajePara(tipo: string): string { return MENSAJES_POR_TIPO[tipo] ?? `Tienes una notificación nueva: ${tipo}`; }

export class PersistenteNotificadorAdapter implements NotificadorPort {
  constructor(private readonly repo: NotificacionRepositoryPort) {}
  async notificar(usuarioId: string, tipo: string, referencia?: ReferenciaNotificacion): Promise<void> {
    await this.repo.guardar(new Notificacion({ id: randomUUID(), usuarioId, tipo, mensaje: referencia?.mensaje ?? mensajePara(tipo), leida: false, fecha: new Date(), entidadTipo: referencia?.entidadTipo, entidadId: referencia?.entidadId }));
  }
}
