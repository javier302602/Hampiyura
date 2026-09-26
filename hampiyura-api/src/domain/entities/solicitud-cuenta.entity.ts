import { TipoCuenta, ETIQUETA_TIPO_CUENTA } from '../value-objects/tipo-cuenta.vo';
import { EstadoValidacion } from '../value-objects/estado-validacion.vo';
import { ValidationError } from '../errors/domain.errors';

// Solicitud de cambio de tipo de cuenta. Pasa por la MISMA bandeja de validación (M-09) que el resto del contenido; como
// "SolicitudCuenta" no tiene área de especialista asignada, solo un Administrador puede decidirla.
export interface SolicitudCuentaProps {
  id: string;
  usuarioId: string;
  tipoSolicitado: TipoCuenta;
  nombreOrganizacion?: string;   // negocio / empresa / institución
  descripcion: string;           // qué produce, a qué se dedica o qué investiga
  identificacion?: string;       // RUC u otro documento (opcional)
  sitioWeb?: string;             // opcional
  estadoValidacion: EstadoValidacion;
  creadaEn: Date;
}

// Campos que pide cada tipo. Productor: el nombre del negocio es opcional (hay campesinos sin negocio formal);
// Empresario e Institución: el nombre es obligatorio.
export function validarSolicitud(p: Pick<SolicitudCuentaProps, 'tipoSolicitado' | 'nombreOrganizacion' | 'descripcion' | 'sitioWeb'>): void {
  const nombre = p.nombreOrganizacion?.trim();
  if (p.tipoSolicitado !== 'Productor' && !nombre) throw new ValidationError(p.tipoSolicitado === 'Empresario' ? 'Indica el nombre de tu empresa' : 'Indica el nombre de la institución');
  if (nombre && nombre.length > 80) throw new ValidationError('El nombre admite hasta 80 caracteres');
  const d = p.descripcion?.trim() ?? '';
  if (d.length < 20) throw new ValidationError('Cuéntanos con al menos 20 caracteres ' + (p.tipoSolicitado === 'Productor' ? 'qué produces' : p.tipoSolicitado === 'Empresario' ? 'a qué se dedica tu empresa' : 'qué investiga tu institución'));
  if (d.length > 600) throw new ValidationError('La descripción admite hasta 600 caracteres');
  if (p.sitioWeb?.trim() && !/^https?:\/\/\S+$/i.test(p.sitioWeb.trim())) throw new ValidationError('El sitio web debe empezar con http:// o https://');
}

export class SolicitudCuenta {
  constructor(public readonly props: SolicitudCuentaProps) {}
  etiquetaTipo(): string { return ETIQUETA_TIPO_CUENTA[this.props.tipoSolicitado]; }
  estaEnCurso(): boolean { return this.props.estadoValidacion === 'Pendiente' || this.props.estadoValidacion === 'EnRevision' || this.props.estadoValidacion === 'Observado'; }
}
