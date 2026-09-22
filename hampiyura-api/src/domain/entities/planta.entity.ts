import { EstadoValidacion } from '../value-objects/estado-validacion.vo';

export interface PlantaProps { id: string; nombreComun: string; nombreCientifico: string; familia: string; region: string; habitat: string; imagenPrincipal?: string; estadoValidacion: EstadoValidacion; }
export class Planta {
  constructor(public readonly props: PlantaProps) {}
  // Mismo criterio que Producto/Publicacion: solo Validado es público. Las plantas ya existentes
  // antes de este cambio quedaron todas en Validado (default de la migración), así que esto no les
  // cambia nada; solo afecta a las propuestas nuevas mientras están Pendiente.
  esVisiblePublicamente(): boolean { return this.props.estadoValidacion === 'Validado'; }
}
