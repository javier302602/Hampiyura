import { ValidationError, UnauthorizedError } from '../errors/domain.errors';

// M-17 · Contrato de compra directa de cosecha, ligado a una ficha de cultivo de M-03 (no a un producto de M-11:
// esto es para pedir la cosecha de un cultivo YA declarado -ej. plátano-, antes de que exista ningún producto
// terminado). Es una operación distinta de "Publicar producto" (comisión 5%, M-16): aquí la comisión es del 3%
// y se paga en dos partes (adelanto del 50% al aceptar, saldo del 50% directo entre las partes al completar).
// HampiYura tampoco custodia dinero aquí: solo registra la propuesta, el comprobante del adelanto y la línea de
// tiempo, igual que M-16.
//
// Máquina de estados:
//   Propuesto --(agricultor acepta, da su medio de cobro)--> AdelantoPendiente --(comprador sube comprobante)-->
//   AdelantoPendiente (con comprobante) --(agricultor confirma)--> EnCurso --(agricultor marca completado)--> Completado
//        |                                                              \--(agricultor rechaza el comprobante)--> AdelantoPendiente (sin comprobante)
//        +--(agricultor rechaza la propuesta)--> Rechazado
//        +--(comprador cancela, antes de reclamar que pagó)--> Cancelado
export const ESTADOS_CONTRATO_CULTIVO = ['Propuesto', 'Rechazado', 'AdelantoPendiente', 'EnCurso', 'Completado', 'Cancelado'] as const;
export type EstadoContratoCultivo = typeof ESTADOS_CONTRATO_CULTIVO[number];
export const METODOS_COBRO_CULTIVO = ['Yape', 'Plin', 'Cuenta'] as const;
export type MetodoCobroCultivo = typeof METODOS_COBRO_CULTIVO[number];
export const PORCENTAJE_ADELANTO_CULTIVO = 50;
export const PORCENTAJE_COMISION_CULTIVO = 3;
export interface EventoContratoCultivo { estado: EstadoContratoCultivo; fecha: Date | string; actorId: string; nota?: string }

export interface ContratoCultivoProps {
  id: string; cultivoId: string; plantaId: string; plantaNombre: string; agricultorId: string; compradorId: string;
  // "cantidad" es texto libre (ej. "50 kg", "200 plantones"): un cultivo no tiene una unidad de venta estandarizada
  // como sí la tiene un Producto publicado. montoAcordado es el TOTAL que propone el comprador (no hay precio
  // unitario de catálogo que multiplicar): el agricultor lo acepta o lo rechaza tal cual, sin contraoferta.
  cantidad: string; montoAcordado: number; montoAdelanto: number; montoSaldo: number; comisionReferencial: number; netoAgricultor: number;
  mensajeComprador?: string;
  cobroMedio?: MetodoCobroCultivo; cobroNumero?: string;
  comprobanteAdelantoUrl?: string; numeroOperacionAdelanto?: string;
  motivoRechazo?: string; motivoRechazoAdelanto?: string;
  estado: EstadoContratoCultivo;
  eventos: EventoContratoCultivo[]; creadoEn: Date; actualizadoEn: Date;
}

const nota = (t: string | undefined, min: number, que: string) => {
  const x = (t ?? '').trim();
  if (x.length < min) throw new ValidationError(`${que}: escribe al menos ${min} caracteres`);
  return x.slice(0, 500);
};

export class ContratoCultivo {
  constructor(public readonly props: ContratoCultivoProps) {}

  private exigirEstado(...estados: EstadoContratoCultivo[]) {
    if (!estados.includes(this.props.estado)) throw new ValidationError(`Esta acción no corresponde al estado actual del contrato (${this.props.estado})`);
  }
  private exigirComprador(id: string) { if (id !== this.props.compradorId) throw new UnauthorizedError('Solo el comprador de este contrato puede hacer esto'); }
  private exigirAgricultor(id: string) { if (id !== this.props.agricultorId) throw new UnauthorizedError('Solo el agricultor de este contrato puede hacer esto'); }
  private pasar(estado: EstadoContratoCultivo, actorId: string, ahora: Date, texto?: string) {
    this.props.estado = estado; this.props.actualizadoEn = ahora;
    this.props.eventos = [...this.props.eventos, { estado, fecha: ahora, actorId, ...(texto ? { nota: texto } : {}) }];
  }

  esParticipante(id: string) { return id === this.props.compradorId || id === this.props.agricultorId; }

  // El agricultor acepta la propuesta tal cual (sin contraoferta) y da el medio por el que recibirá el adelanto:
  // es una operación negociada de una sola vez, no un catálogo reutilizable, así que el cobro se declara aquí y no aparte.
  aceptar(agricultorId: string, medio: MetodoCobroCultivo, numero: string, ahora = new Date()) {
    this.exigirAgricultor(agricultorId); this.exigirEstado('Propuesto');
    const n = (numero ?? '').replace(/[\s-]/g, '');
    if (medio === 'Yape' || medio === 'Plin') { if (!/^9\d{8}$/.test(n)) throw new ValidationError(`El número de ${medio} debe ser un celular peruano de 9 dígitos que empiece con 9`); }
    else if (medio === 'Cuenta') { if (n.length < 8 || n.length > 120) throw new ValidationError('La cuenta bancaria (banco y número o CCI) debe tener entre 8 y 120 caracteres'); }
    else throw new ValidationError('Medio de cobro inválido: elige Yape, Plin o Cuenta');
    this.props.cobroMedio = medio; this.props.cobroNumero = n;
    this.pasar('AdelantoPendiente', agricultorId, ahora, `Propuesta aceptada. Adelanto del ${PORCENTAJE_ADELANTO_CULTIVO}% (S/ ${this.props.montoAdelanto.toFixed(2)}) a pagar por ${medio}`);
  }
  rechazar(agricultorId: string, motivo: string, ahora = new Date()) {
    this.exigirAgricultor(agricultorId); this.exigirEstado('Propuesto');
    const m = nota(motivo, 5, 'Motivo del rechazo');
    this.props.motivoRechazo = m; this.pasar('Rechazado', agricultorId, ahora, m);
  }
  // Comprador: sube el comprobante del adelanto (también vuelve a hacerlo si el agricultor lo rechazó).
  informarAdelanto(compradorId: string, comprobanteUrl: string, numeroOperacion: string | undefined, ahora = new Date()) {
    this.exigirComprador(compradorId); this.exigirEstado('AdelantoPendiente');
    if (!comprobanteUrl?.startsWith('/uploads/')) throw new ValidationError('Sube la captura del comprobante del adelanto');
    this.props.comprobanteAdelantoUrl = comprobanteUrl; this.props.numeroOperacionAdelanto = numeroOperacion?.trim().slice(0, 40) || undefined;
    this.props.motivoRechazoAdelanto = undefined;
    this.pasar('AdelantoPendiente', compradorId, ahora, 'Comprobante del adelanto subido');
  }
  confirmarAdelanto(agricultorId: string, ahora = new Date()) {
    this.exigirAgricultor(agricultorId); this.exigirEstado('AdelantoPendiente');
    if (!this.props.comprobanteAdelantoUrl) throw new ValidationError('El comprador todavía no subió el comprobante del adelanto');
    this.pasar('EnCurso', agricultorId, ahora, 'Adelanto confirmado: el agricultor prepara la cosecha');
  }
  rechazarAdelanto(agricultorId: string, motivo: string, ahora = new Date()) {
    this.exigirAgricultor(agricultorId); this.exigirEstado('AdelantoPendiente');
    if (!this.props.comprobanteAdelantoUrl) throw new ValidationError('El comprador todavía no subió el comprobante del adelanto');
    const m = nota(motivo, 5, 'Motivo del rechazo del adelanto');
    this.props.motivoRechazoAdelanto = m; this.props.comprobanteAdelantoUrl = undefined; this.props.numeroOperacionAdelanto = undefined;
    this.pasar('AdelantoPendiente', agricultorId, ahora, m);
  }
  // Agricultor: entregó la cosecha y recibió el saldo (directo del comprador, fuera de la plataforma -- igual que M-16, HampiYura no lo custodia).
  marcarCompletado(agricultorId: string, ahora = new Date()) {
    this.exigirAgricultor(agricultorId); this.exigirEstado('EnCurso');
    this.pasar('Completado', agricultorId, ahora, `Cosecha entregada y saldo (S/ ${this.props.montoSaldo.toFixed(2)}) recibido directamente del comprador`);
  }
  // Solo antes de que el comprador reclame haber pagado el adelanto: después de eso, el agricultor ya puede haber
  // empezado a preparar la cosecha, así que la cancelación unilateral deja de estar disponible (igual criterio que M-16).
  cancelar(compradorId: string, ahora = new Date()) {
    this.exigirComprador(compradorId); this.exigirEstado('Propuesto', 'AdelantoPendiente');
    if (this.props.comprobanteAdelantoUrl) throw new ValidationError('Ya subiste el comprobante del adelanto: coordina con el agricultor, no se puede cancelar solo desde aquí');
    this.pasar('Cancelado', compradorId, ahora, 'El comprador canceló la propuesta');
  }
}
