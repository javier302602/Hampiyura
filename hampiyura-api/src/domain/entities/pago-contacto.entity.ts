import { ConceptoPago, DIAS_VIGENCIA, MetodoPago, PlanDePago } from '../value-objects/plan.vo';
import { ValidationError } from '../errors/domain.errors';

export type EstadoPagoRegistrado = 'Pendiente' | 'Confirmado' | 'Rechazado';
// 'Vencido' no se guarda: es Confirmado cuyo vigenteHasta ya pasó (ver estadoEfectivo).
export type EstadoPagoEfectivo = EstadoPagoRegistrado | 'Vencido';

export interface PagoContactoProps {
  id: string;
  usuarioId: string;
  concepto: ConceptoPago;
  plan?: PlanDePago;
  productorId?: string;
  monto: number;
  metodo: MetodoPago;
  numeroOperacion?: string;
  comprobanteUrl: string;
  estado: EstadoPagoRegistrado;
  creadoEn: Date;
  revisadoPorId?: string;
  revisadoEn?: Date;
  motivoRechazo?: string;
  vigenteDesde?: Date;
  vigenteHasta?: Date;
}

const MS_DIA = 24 * 60 * 60 * 1000;

export class PagoContacto {
  constructor(public readonly props: PagoContactoProps) {}

  private exigirPendiente() {
    if (this.props.estado !== 'Pendiente') throw new ValidationError(`Este pago ya fue resuelto (estado: ${this.props.estado})`);
  }
  // Confirmar = un administrador comprobó el pago. Desde ese instante corre la vigencia.
  confirmar(adminId: string, ahora = new Date()) {
    this.exigirPendiente();
    this.props.estado = 'Confirmado';
    this.props.revisadoPorId = adminId;
    this.props.revisadoEn = ahora;
    this.props.vigenteDesde = ahora;
    this.props.vigenteHasta = new Date(ahora.getTime() + DIAS_VIGENCIA * MS_DIA);
  }
  rechazar(adminId: string, motivo: string, ahora = new Date()) {
    this.exigirPendiente();
    if (!motivo?.trim()) throw new ValidationError('El motivo del rechazo es obligatorio');
    this.props.estado = 'Rechazado';
    this.props.revisadoPorId = adminId;
    this.props.revisadoEn = ahora;
    this.props.motivoRechazo = motivo.trim();
  }
  // Vigente = confirmado y dentro de su ventana. Es lo único que da acceso al contacto.
  estaVigente(ahora = new Date()): boolean {
    return this.props.estado === 'Confirmado' && !!this.props.vigenteHasta && this.props.vigenteHasta.getTime() > ahora.getTime();
  }
  estadoEfectivo(ahora = new Date()): EstadoPagoEfectivo {
    if (this.props.estado === 'Confirmado' && !this.estaVigente(ahora)) return 'Vencido';
    return this.props.estado;
  }
}
