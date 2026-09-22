export interface PlantaProps { id: string; nombreComun: string; nombreCientifico: string; familia: string; region: string; habitat: string; imagenPrincipal?: string; }
export class Planta { constructor(public readonly props: PlantaProps) {} }
