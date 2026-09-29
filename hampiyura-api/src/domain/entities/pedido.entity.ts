import { ValidationError, UnauthorizedError } from '../errors/domain.errors';

// M-16 · Pedido de compra directa. Máquina de estados (nadie salta pasos ni actúa fuera de su rol):
//
//   PendientePago --(comprador sube comprobante)--> PagoInformado --(vendedor confirma)--> PagoConfirmado --(vendedor envía)--> Enviado --(comprador confirma)--> Recibido
//        |                                              |                                        \______(comprador confirma la recepción también aquí)_____/
//        |                                              +--(vendedor rechaza: no llegó el pago)--> PagoRechazado --(comprador vuelve a informar)--> PagoInformado
//        +--(comprador cancela)--> Cancelado            PagoConfirmado / Enviado --(comprador, vencido el plazo o disconforme)--> Reclamo --(administrador)--> Cerrado
export const ESTADOS_PEDIDO = ['PendientePago', 'PagoInformado', 'PagoRechazado', 'PagoConfirmado', 'Enviado', 'Recibido', 'Reclamo', 'Cerrado', 'Cancelado'] as const;
export type EstadoPedido = typeof ESTADOS_PEDIDO[number];
export const METODOS_COBRO = ['Yape', 'Plin', 'Cuenta'] as const;
export type MetodoCobro = typeof METODOS_COBRO[number];
export type CobroSnapshot = { yape?: string; plin?: string; cuenta?: string };
export interface EventoPedido { estado: EstadoPedido; fecha: Date | string; actorId: string; nota?: string }

export interface PedidoProps {
  id: string; productoId: string; productoNombre: string; compradorId: string; vendedorId: string;
  cantidad: number; precioUnitario: number; total: number; comisionReferencial: number;
  entregaNombre: string; entregaTelefono: string; entregaDireccion: string;
  cobro: CobroSnapshot; metodoElegido?: MetodoCobro; comprobanteUrl?: string; numeroOperacion?: string;
  estado: EstadoPedido; entregaDias: number; fechaLimiteEntrega?: Date;
  contratoVersion: string; contratoTexto: string; compradorAceptoEn: Date; vendedorCompromisoEn: Date;
  notaEnvio?: string; motivoRechazoPago?: string; motivoReclamo?: string; resolucion?: string;
  eventos: EventoPedido[]; creadoEn: Date; actualizadoEn: Date;
}

const MS_DIA = 24 * 60 * 60 * 1000;
const nota = (t: string | undefined, min: number, que: string) => {
  const x = (t ?? '').trim();
  if (x.length < min) throw new ValidationError(`${que}: escribe al menos ${min} caracteres`);
  return x.slice(0, 500);
};

export class Pedido {
  constructor(public readonly props: PedidoProps) {}

  private exigirEstado(...estados: EstadoPedido[]) {
    if (!estados.includes(this.props.estado)) throw new ValidationError(`Esta acción no corresponde al estado actual del pedido (${this.props.estado})`);
  }
  private exigirComprador(id: string) { if (id !== this.props.compradorId) throw new UnauthorizedError('Solo el comprador de este pedido puede hacer esto'); }
  private exigirVendedor(id: string) { if (id !== this.props.vendedorId) throw new UnauthorizedError('Solo el vendedor de este pedido puede hacer esto'); }
  private pasar(estado: EstadoPedido, actorId: string, ahora: Date, texto?: string) {
    this.props.estado = estado; this.props.actualizadoEn = ahora;
    this.props.eventos = [...this.props.eventos, { estado, fecha: ahora, actorId, ...(texto ? { nota: texto } : {}) }];
  }

  esParticipante(id: string) { return id === this.props.compradorId || id === this.props.vendedorId; }
  mediosDisponibles(): MetodoCobro[] { return METODOS_COBRO.filter((m) => !!this.props.cobro[m.toLowerCase() as 'yape' | 'plin' | 'cuenta']); }
  plazoVencido(ahora = new Date()): boolean { return !!this.props.fechaLimiteEntrega && ahora.getTime() > this.props.fechaLimiteEntrega.getTime(); }

  // Comprador: sube el comprobante del pago que hizo al vendedor (también vuelve a hacerlo si el vendedor lo rechazó).
  informarPago(compradorId: string, metodo: string, comprobanteUrl: string, numeroOperacion: string | undefined, ahora = new Date()) {
    this.exigirComprador(compradorId); this.exigirEstado('PendientePago', 'PagoRechazado');
    if (!(this.mediosDisponibles() as string[]).includes(metodo)) throw new ValidationError(`El vendedor no cobra por ${metodo}: elige ${this.mediosDisponibles().join(' o ')}`);
    // Solo comprobantes subidos a esta plataforma: nunca una URL arbitraria.
    if (!comprobanteUrl?.startsWith('/uploads/')) throw new ValidationError('Sube la captura del comprobante de pago');
    this.props.metodoElegido = metodo as MetodoCobro; this.props.comprobanteUrl = comprobanteUrl; this.props.numeroOperacion = numeroOperacion?.trim().slice(0, 40) || undefined;
    this.props.motivoRechazoPago = undefined;
    this.pasar('PagoInformado', compradorId, ahora, `Comprobante subido (${metodo})`);
  }
  // Vendedor: confirma que el dinero llegó. Desde aquí corre el plazo de entrega que se comprometió a cumplir.
  confirmarPago(vendedorId: string, ahora = new Date()) {
    this.exigirVendedor(vendedorId); this.exigirEstado('PagoInformado');
    this.props.fechaLimiteEntrega = new Date(ahora.getTime() + this.props.entregaDias * MS_DIA);
    this.pasar('PagoConfirmado', vendedorId, ahora, `Pago confirmado. Plazo de entrega: ${this.props.entregaDias} días`);
  }
  rechazarPago(vendedorId: string, motivo: string, ahora = new Date()) {
    this.exigirVendedor(vendedorId); this.exigirEstado('PagoInformado');
    const m = nota(motivo, 5, 'Motivo del rechazo del pago');
    this.props.motivoRechazoPago = m; this.pasar('PagoRechazado', vendedorId, ahora, m);
  }
  marcarEnviado(vendedorId: string, notaEnvio: string, ahora = new Date()) {
    this.exigirVendedor(vendedorId); this.exigirEstado('PagoConfirmado');
    const n = nota(notaEnvio, 5, 'Nota de envío (transporte, guía o forma de entrega)');
    this.props.notaEnvio = n; this.pasar('Enviado', vendedorId, ahora, n);
  }
  confirmarRecepcion(compradorId: string, ahora = new Date()) {
    this.exigirComprador(compradorId); this.exigirEstado('PagoConfirmado', 'Enviado');
    this.pasar('Recibido', compradorId, ahora, 'El comprador confirmó que recibió el producto');
  }
  // Comprador: reclama si venció el plazo de entrega o si el producto no es conforme (solo con el pago ya confirmado).
  abrirReclamo(compradorId: string, motivo: string, ahora = new Date()) {
    this.exigirComprador(compradorId); this.exigirEstado('PagoConfirmado', 'Enviado');
    const m = nota(motivo, 10, 'Motivo del reclamo');
    if (this.props.estado === 'PagoConfirmado' && !this.plazoVencido(ahora)) throw new ValidationError('Todavía está dentro del plazo de entrega: puedes reclamar cuando venza, o si el vendedor ya lo marcó como enviado y el producto no es conforme');
    this.props.motivoReclamo = m; this.pasar('Reclamo', compradorId, ahora, m);
  }
  // Administrador: cierra el reclamo con una resolución por escrito (lo acordado entre las partes queda anotado).
  resolverReclamo(adminId: string, resolucion: string, ahora = new Date()) {
    this.exigirEstado('Reclamo');
    const r = nota(resolucion, 10, 'Resolución del reclamo');
    this.props.resolucion = r; this.pasar('Cerrado', adminId, ahora, r);
  }
  cancelar(compradorId: string, ahora = new Date()) {
    this.exigirComprador(compradorId); this.exigirEstado('PendientePago', 'PagoRechazado');
    this.pasar('Cancelado', compradorId, ahora, 'El comprador canceló el pedido antes de que se confirmara un pago');
  }
}
