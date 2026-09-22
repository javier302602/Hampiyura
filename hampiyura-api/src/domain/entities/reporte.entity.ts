import { EstadoReporte } from '../value-objects/estado-reporte.vo';
import { ValidationError } from '../errors/domain.errors';

// Reporte: alerta de un usuario sobre contenido YA PUBLICADO que puede estar mal
// (planta, ficha de cultivo, parte+uso...). No confundir con ValidacionContenido,
// que es el flujo de aprobación de contenido NUEVO antes de publicarse (M-09).
export interface ReporteProps { id: string; tipoEntidad: string; entidadId: string; autorId: string; motivo: string; fecha: Date; estado: EstadoReporte; }

export class Reporte {
  constructor(public readonly props: ReporteProps) {}
  private exigirPendiente() { if (this.props.estado !== 'Pendiente') throw new ValidationError(`El reporte ya fue resuelto (estado: ${this.props.estado})`); }
  marcarRevisado() { this.exigirPendiente(); this.props.estado = 'Revisado'; }
  marcarDesestimado() { this.exigirPendiente(); this.props.estado = 'Desestimado'; }
}
