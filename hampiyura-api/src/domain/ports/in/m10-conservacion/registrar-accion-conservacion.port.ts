import { AccionConservacion } from '../../../entities/accion-conservacion.entity';
export type RegistrarAccionConservacionInput = Omit<AccionConservacion['props'], 'id' | 'fecha'>;
export interface RegistrarAccionConservacionPort { ejecutar(input: RegistrarAccionConservacionInput): Promise<AccionConservacion>; }
