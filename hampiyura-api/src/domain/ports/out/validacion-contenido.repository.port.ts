import { ValidacionContenido } from '../../entities/validacion-contenido.entity';
export interface ValidacionContenidoRepositoryPort { buscarPorId(id:string):Promise<ValidacionContenido|null>; guardar(validacion:ValidacionContenido):Promise<void>; listarPendientes():Promise<ValidacionContenido[]>; listar():Promise<ValidacionContenido[]>; }
