import { Planta } from '../../../entities/planta.entity';
export type RegistrarPlantaInput = Omit<Planta['props'], 'id'>;
export interface RegistrarPlantaPort { ejecutar(input:RegistrarPlantaInput):Promise<Planta>; }
