import { Planta } from '../../entities/planta.entity';
export interface PlantaRepositoryPort { guardar(planta:Planta):Promise<void>; listar():Promise<Planta[]>; buscarPorId(id:string):Promise<Planta|null>; eliminar(id:string):Promise<void>; contar():Promise<number>; }
