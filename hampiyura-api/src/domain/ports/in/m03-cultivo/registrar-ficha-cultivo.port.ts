import { Cultivo } from '../../../entities/cultivo.entity';
export type RegistrarFichaCultivoInput = Omit<Cultivo['props'],'id'|'estadoValidacion'>;
export interface RegistrarFichaCultivoPort { ejecutar(input:RegistrarFichaCultivoInput):Promise<Cultivo>; }
