import { EstadoValidacion } from '../value-objects/estado-validacion.vo';

export interface PlantaProps { id: string; nombreComun: string; nombreCientifico: string; familia: string; region: string; habitat: string; imagenPrincipal?: string; latitud?: number | null; longitud?: number | null; estadoValidacion: EstadoValidacion; }
// Devuelve las props sin la ubicación de observación: es lo único que sale por el catálogo público.
export function propsPublicasDePlanta(p: PlantaProps): Omit<PlantaProps, 'latitud' | 'longitud'> { const { latitud: _la, longitud: _lo, ...resto } = p; return resto; }
export class Planta {
  constructor(public readonly props: PlantaProps) {}
  // Mismo criterio que Producto/Publicacion: solo Validado es público. Las plantas ya existentes
  // antes de este cambio quedaron todas en Validado (default de la migración), así que esto no les
  // cambia nada; solo afecta a las propuestas nuevas mientras están Pendiente.
  esVisiblePublicamente(): boolean { return this.props.estadoValidacion === 'Validado'; }
}
