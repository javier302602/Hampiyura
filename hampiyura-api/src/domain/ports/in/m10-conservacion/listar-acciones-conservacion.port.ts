import { AccionConservacion } from '../../../entities/accion-conservacion.entity';
export interface ListarAccionesConservacionPort { ejecutar(plantaId: string): Promise<AccionConservacion[]>; }
