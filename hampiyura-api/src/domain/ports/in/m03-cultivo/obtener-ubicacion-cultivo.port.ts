import { UbicacionCultivo } from '../../../entities/ubicacion-cultivo.entity';
export interface ObtenerUbicacionCultivoPort { ejecutar(cultivoId: string): Promise<UbicacionCultivo | null>; }
