import { Cultivo } from '../../entities/cultivo.entity';
import { EstadoValidacion } from '../../value-objects/estado-validacion.vo';
export interface CultivoRepositoryPort { guardar(cultivo:Cultivo):Promise<void>; buscarPorId(id:string):Promise<Cultivo|null>; listarPorPlanta(plantaId:string):Promise<Cultivo[]>; actualizarEstadoValidacion(id:string, estado:EstadoValidacion):Promise<void>; }
