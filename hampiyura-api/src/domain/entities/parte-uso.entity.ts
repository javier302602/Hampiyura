import { Fuente } from '../value-objects/fuente.vo';
import { EstadoValidacion } from '../value-objects/estado-validacion.vo';
import { TipoParte } from '../value-objects/tipo-parte.vo';
import { TipoConocimiento } from '../value-objects/tipo-conocimiento.vo';

export interface ParteUsoProps {
  id: string;
  plantaId: string;
  autorId: string;
  parte: TipoParte;
  usoId: string;
  tipoConocimiento: TipoConocimiento;
  // RF-255: enlace a la preparación asociada (M-05). M-05 todavía no existe: el campo
  // se declara y persiste, pero nada lo valida ni lo resuelve todavía.
  preparacionId?: string;
  // RF-258: solo se llena si la fuente citada declara contraindicaciones explícitamente.
  // El sistema nunca las infiere ni las autocompleta.
  contraindicaciones?: string;
  // Texto de quien propone: por qué/para qué se usa; y, si parte === 'Otra', cuál es.
  motivoUso?: string;
  parteDetalle?: string;
  fuente: Fuente;
  estadoValidacion: EstadoValidacion;
}

export class ParteUso {
  constructor(public readonly props: ParteUsoProps) {}

  // RF-255, criterio de aceptación: nunca se presenta como "tratamiento verificado"
  // si el conocimiento es tradicional/pendiente o si un especialista no lo validó.
  puedeMostrarseComoVerificado(): boolean {
    return this.props.tipoConocimiento === 'Científico' && this.props.estadoValidacion === 'Validado';
  }

  etiquetaAdvertencia(): string | null {
    if (this.puedeMostrarseComoVerificado()) return null;
    return 'Este uso no está verificado científicamente: se basa en conocimiento tradicional o está pendiente de validación por un especialista. No debe interpretarse como un tratamiento médico verificado.';
  }
}
