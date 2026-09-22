import { Usuario } from '../../entities/usuario.entity';
export interface UsuarioRepositoryPort { buscarPorCorreo(correo:string):Promise<Usuario|null>; buscarPorId(id:string):Promise<Usuario|null>; guardar(usuario:Usuario):Promise<void>; actualizar(usuario:Usuario):Promise<void>; listar():Promise<Usuario[]>; contar():Promise<number>; contarActivos():Promise<number>; }
