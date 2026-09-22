import { Planta } from '../../entities/planta.entity';
import { EstadoValidacion } from '../../value-objects/estado-validacion.vo';
export interface PlantaRepositoryPort { guardar(planta:Planta):Promise<void>; listar():Promise<Planta[]>; buscarPorId(id:string):Promise<Planta|null>; eliminar(id:string):Promise<void>; contar():Promise<number>; actualizarEstadoValidacion(id:string, estado:EstadoValidacion):Promise<void>; }
