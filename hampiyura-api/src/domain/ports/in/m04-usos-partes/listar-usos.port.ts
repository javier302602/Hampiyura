import { Uso } from '../../../entities/uso.entity';
export interface ListarUsosPort { ejecutar(): Promise<Uso[]>; }
