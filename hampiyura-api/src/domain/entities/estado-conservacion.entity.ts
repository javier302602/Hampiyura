import { Fuente } from '../value-objects/fuente.vo';
import { EstadoValidacion } from '../value-objects/estado-validacion.vo';
import { NivelRiesgoConservacion, esNivelEnRiesgo } from '../value-objects/nivel-riesgo-conservacion.vo';

// RF-267: ninguna planta muestra un estado de conservación sin una fuente citada y visible.
// `fuenteOficial` es de tipo Fuente (VO cuyo constructor ya lanza ValidationError si viene vacía),
// así que es estructuralmente imposible construir un EstadoConservacion sin fuente -- el texto
// "no determinado" no es responsabilidad de esta entidad, sino de quien consulta la ficha de la
// planta cuando NO existe ningún EstadoConservacion validado (ver aVistaConservacion en M-02).
export const TEXTO_CONSERVACION_NO_DETERMINADO = 'Estado de conservación: no determinado — pendiente de fuente oficial';

export interface EstadoConservacionProps {
  id: string;
  plantaId: string;
  autorId: string;
  categoria: string; // p.ej. "Vulnerable", "En peligro" (la categoría/nombre tal como la cita la fuente)
  // Descripción textual GENERAL -- nunca coordenadas exactas (regla de no-exposición del módulo).
  zona: string;
  amenazas: string;
  nivelRiesgo: NivelRiesgoConservacion;
  disponibilidadTemporada: string;
  recomendacionesConservacion: string; // cubre también RF-270
  metodosPropagacion: string;
  alternativasCultivo: string;
  fuenteOficial: Fuente;
  fecha: Date;
  estadoValidacion: EstadoValidacion;
}

export class EstadoConservacion {
  constructor(public readonly props: EstadoConservacionProps) {}
  esVisiblePublicamente(): boolean { return this.props.estadoValidacion === 'Validado'; }
  // RF-269: alerta visible en la ficha de la planta cuando el nivel de riesgo lo amerita.
  estaEnRiesgo(): boolean { return esNivelEnRiesgo(this.props.nivelRiesgo); }
}
