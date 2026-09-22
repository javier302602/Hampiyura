import { EstadoConservacion } from '../../../entities/estado-conservacion.entity';
export type RegistrarEstadoConservacionInput = Omit<EstadoConservacion['props'], 'id' | 'estadoValidacion' | 'fecha'>;
export interface RegistrarEstadoConservacionPort { ejecutar(input: RegistrarEstadoConservacionInput): Promise<EstadoConservacion>; }
