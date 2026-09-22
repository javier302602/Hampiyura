import { Fuente } from '../value-objects/fuente.vo';
import { EstadoValidacion } from '../value-objects/estado-validacion.vo';
import { TipoConocimiento } from '../value-objects/tipo-conocimiento.vo';

// RF-09: nombreComun/descripcion/enfermedadesTratadas/formaPreparacion son el contenido de la
// publicación. "enfermedadesTratadas" es una afirmación de uso medicinal igual que en M-04, así
// que lleva tipoConocimiento + fuente + estadoValidacion y NUNCA se muestra como "verificado" sin
// pasar por M-09 (mismo principio de RF-257).
export interface PublicacionProps {
  id: string;
  plantaId: string;
  autorId: string;
  nombreComun: string;
  descripcion: string;
  enfermedadesTratadas: string;
  formaPreparacion: string;
  imagenes: string[];
  tipoConocimiento: TipoConocimiento;
  fuente: Fuente;
  fechaPublicacion: Date;
  estadoValidacion: EstadoValidacion;
}

export class Publicacion {
  constructor(public readonly props: PublicacionProps) {}
  puedeMostrarseComoVerificado(): boolean { return this.props.tipoConocimiento === 'Científico' && this.props.estadoValidacion === 'Validado'; }
  etiquetaAdvertencia(): string | null {
    if (this.puedeMostrarseComoVerificado()) return null;
    return 'Esta publicación no está verificada científicamente: se basa en conocimiento tradicional o está pendiente de validación por un especialista. No debe interpretarse como un tratamiento médico verificado.';
  }
  esVisiblePublicamente(): boolean { return this.props.estadoValidacion === 'Validado'; }
}
