import { Valoracion } from '../../../entities/valoracion.entity';
export type CalificarPublicacionInput = { publicacionId: string; autorId: string; estrellas: number };
export interface CalificarPublicacionPort { ejecutar(input: CalificarPublicacionInput): Promise<Valoracion>; }
