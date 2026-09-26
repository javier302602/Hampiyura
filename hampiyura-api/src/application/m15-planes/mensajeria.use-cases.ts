import { randomUUID } from 'crypto';
import { AccesoContactoService, DirectorioProductoresUseCase, Solicitante } from './planes.use-cases';
import { MensajeriaRepositoryPort, ConversacionDatos, MensajeDirectoDatos } from '../../domain/ports/out/mensajeria-alertas.ports';
import { UsuarioRepositoryPort } from '../../domain/ports/out/usuario.repository.port';
import { NotificadorPort } from '../../domain/ports/out/notificador.port';
import { tieneMensajeriaYAlertas } from '../../domain/value-objects/plan.vo';
import { NotFoundError, UnauthorizedError, ValidationError } from '../../domain/errors/domain.errors';

// Ronda 30 · Plan Negocio: mensajería directa DENTRO de la plataforma entre un comprador con plan (Negocio o superior) y un productor contactable.
// Reglas: (1) solo quien tenga un plan de pago vigente (o un administrador) puede INICIAR una conversación; (2) el productor solo puede responder
// dentro de una conversación ya iniciada; (3) el productor debe ser contactable (ficha de cultivo validada, mismo criterio que el directorio);
// (4) los mensajes solo los ven los dos participantes; (5) no se comparte ningún dato personal automáticamente: cada uno escribe lo que quiere decir.
export const MAX_CARACTERES_MENSAJE = 1000;
export const MAX_MENSAJES_POR_HORA = 30;

export interface ConversacionResumen {
  id: string; conTipo: 'productor' | 'comprador'; conId: string; conNombre: string;
  ultimoMensaje?: { texto: string; creadoEn: Date; propio: boolean }; sinLeer: number; actualizadaEn: Date;
}
export interface MensajeVisible { id: string; texto: string; creadoEn: Date; propio: boolean; leido: boolean }
export interface ConversacionDetalle { id: string; conNombre: string; conTipo: 'productor' | 'comprador'; puedeResponder: boolean; motivoBloqueo?: string; mensajes: MensajeVisible[] }

export class MensajeriaUseCase {
  constructor(
    private readonly repo: MensajeriaRepositoryPort, private readonly usuarios: UsuarioRepositoryPort, private readonly acceso: AccesoContactoService,
    private readonly directorio: DirectorioProductoresUseCase, private readonly notificador: NotificadorPort,
  ) {}

  private async nombreDe(id: string): Promise<string> {
    const u = await this.usuarios.buscarPorId(id);
    if (!u) return 'Usuario';
    return u.props.nombreNegocio ? `${u.props.nombreNegocio} (${u.props.nombre})` : u.props.nombre;
  }
  private validarTexto(texto: string): string {
    const t = (texto ?? '').trim();
    if (!t) throw new ValidationError('Escribe un mensaje');
    if (t.length > MAX_CARACTERES_MENSAJE) throw new ValidationError(`El mensaje no puede pasar de ${MAX_CARACTERES_MENSAJE} caracteres`);
    return t;
  }
  private async exigirPlanDeComprador(s: Solicitante) {
    if (s.rol === 'Administrador') return;
    const { plan } = await this.acceso.planActivo(s.id);
    if (!tieneMensajeriaYAlertas(plan)) throw new UnauthorizedError('La mensajería directa es del plan Negocio o superior (con un plan de pago vigente)');
  }
  private async exigirLimite(autorId: string, ahora: Date) {
    if ((await this.repo.contarMensajesDesde(autorId, new Date(ahora.getTime() - 3600_000))) >= MAX_MENSAJES_POR_HORA) throw new ValidationError('Enviaste muchos mensajes en poco tiempo; espera un rato antes de seguir');
  }

  // El comprador escribe a un productor: crea la conversación si no existía.
  async escribirAProductor(remitente: Solicitante, productorId: string, texto: string, ahora = new Date()): Promise<{ conversacionId: string }> {
    const t = this.validarTexto(texto);
    if (remitente.id === productorId) throw new ValidationError('No puedes escribirte a ti mismo');
    await this.exigirPlanDeComprador(remitente);
    if (!(await this.directorio.esContactable(productorId))) throw new ValidationError('Este productor no está disponible en el directorio (necesita una ficha de cultivo validada)');
    await this.exigirLimite(remitente.id, ahora);
    let conv = await this.repo.buscarConversacion(remitente.id, productorId);
    if (!conv) { conv = { id: randomUUID(), compradorId: remitente.id, productorId, creadaEn: ahora, actualizadaEn: ahora }; await this.repo.crearConversacion(conv); }
    await this.guardar(conv, remitente.id, t, ahora);
    return { conversacionId: conv.id };
  }

  // Cualquiera de los dos participantes responde dentro de una conversación existente.
  async responder(remitente: Solicitante, conversacionId: string, texto: string, ahora = new Date()): Promise<void> {
    const t = this.validarTexto(texto);
    const conv = await this.cargarParticipante(conversacionId, remitente.id);
    if (remitente.id === conv.compradorId) await this.exigirPlanDeComprador(remitente); // el comprador necesita su plan vigente para seguir escribiendo
    await this.exigirLimite(remitente.id, ahora);
    await this.guardar(conv, remitente.id, t, ahora);
  }

  private async guardar(conv: ConversacionDatos, autorId: string, texto: string, ahora: Date) {
    const m: MensajeDirectoDatos = { id: randomUUID(), conversacionId: conv.id, autorId, texto, creadoEn: ahora };
    await this.repo.guardarMensaje(m);
    const otro = autorId === conv.compradorId ? conv.productorId : conv.compradorId;
    await this.notificador.notificar(otro, 'mensaje_directo', { entidadTipo: 'Conversacion', entidadId: conv.id, mensaje: `Tienes un mensaje nuevo de ${await this.nombreDe(autorId)} en Mensajes.` });
  }

  private async cargarParticipante(id: string, usuarioId: string): Promise<ConversacionDatos> {
    const conv = await this.repo.buscarConversacionPorId(id);
    // Misma respuesta para "no existe" y "no es tuya": no se revela que la conversación existe.
    if (!conv || (conv.compradorId !== usuarioId && conv.productorId !== usuarioId)) throw new NotFoundError('Conversación no encontrada');
    return conv;
  }

  async listar(usuarioId: string): Promise<ConversacionResumen[]> {
    const convs = await this.repo.listarConversacionesDe(usuarioId);
    return Promise.all(convs.map(async (c) => {
      const soyComprador = c.compradorId === usuarioId;
      const conId = soyComprador ? c.productorId : c.compradorId;
      const msgs = await this.repo.listarMensajes(c.id);
      const ultimo = msgs[msgs.length - 1];
      return {
        id: c.id, conTipo: soyComprador ? 'productor' as const : 'comprador' as const, conId, conNombre: await this.nombreDe(conId),
        ultimoMensaje: ultimo ? { texto: ultimo.texto.length > 120 ? `${ultimo.texto.slice(0, 119)}…` : ultimo.texto, creadoEn: ultimo.creadoEn, propio: ultimo.autorId === usuarioId } : undefined,
        sinLeer: msgs.filter((m) => m.autorId !== usuarioId && !m.leidoEn).length, actualizadaEn: c.actualizadaEn,
      };
    }));
  }

  async sinLeerTotal(usuarioId: string): Promise<number> { return (await this.listar(usuarioId)).reduce((s, c) => s + c.sinLeer, 0); }

  // Abrir la conversación marca como leídos los mensajes de la otra persona.
  async obtener(usuarioId: string, conversacionId: string, ahora = new Date()): Promise<ConversacionDetalle> {
    const conv = await this.cargarParticipante(conversacionId, usuarioId);
    await this.repo.marcarLeidos(conv.id, usuarioId, ahora);
    const soyComprador = conv.compradorId === usuarioId;
    const mensajes = (await this.repo.listarMensajes(conv.id)).map((m) => ({ id: m.id, texto: m.texto, creadoEn: m.creadoEn, propio: m.autorId === usuarioId, leido: !!m.leidoEn || m.autorId !== usuarioId }));
    let puedeResponder = true; let motivoBloqueo: string | undefined;
    if (soyComprador) {
      const u = await this.usuarios.buscarPorId(usuarioId);
      if (u?.props.rol !== 'Administrador' && !tieneMensajeriaYAlertas((await this.acceso.planActivo(usuarioId)).plan)) { puedeResponder = false; motivoBloqueo = 'Tu plan de pago venció: renuévalo para seguir escribiendo.'; }
    }
    return { id: conv.id, conNombre: await this.nombreDe(soyComprador ? conv.productorId : conv.compradorId), conTipo: soyComprador ? 'productor' : 'comprador', puedeResponder, motivoBloqueo, mensajes };
  }
}
