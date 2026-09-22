import { Fuente } from '../value-objects/fuente.vo';
import { EstadoValidacion } from '../value-objects/estado-validacion.vo';

// RF-259: toda preparación cuelga de una combinación Parte+Uso ya existente en M-04
// (no se documenta una preparación "de la nada").
export interface PreparacionProps {
  id: string;
  parteUsoId: string;
  autorId: string;
  ingredientes: string;
  pasos: string;
  herramientas: string;
  tiempoPreparacion: string;
  formaTradicionalElaboracion: string;
  formaConservacion: string;
  advertencias: string;
  // RF-259/RF-258: solo se llena si la fuente la declara explícitamente, nunca inferida.
  contraindicaciones?: string;
  fuente: Fuente;
  localidad: string;
  fecha: Date;
  estadoValidacion: EstadoValidacion;
}

// Criterio de aceptación de RF-259: este aviso es incondicional -- viaja en TODA preparación
// publicada, sin importar su estado. No es un texto que el frontend decida mostrar.
export const AVISO_CULTURAL_TRADICIONAL = 'Esta preparación documenta conocimiento cultural/tradicional; no constituye una indicación médica ni sustituye la consulta con un profesional de salud.';

export class Preparacion {
  constructor(public readonly props: PreparacionProps) {}
  avisoLegal(): string { return AVISO_CULTURAL_TRADICIONAL; }
  esVisiblePublicamente(): boolean { return this.props.estadoValidacion === 'Validado'; }
}
