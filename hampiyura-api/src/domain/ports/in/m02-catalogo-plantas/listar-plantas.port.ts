import { Planta } from '../../../entities/planta.entity';
export interface ListarPlantasPort { ejecutar():Promise<Planta[]>; }
