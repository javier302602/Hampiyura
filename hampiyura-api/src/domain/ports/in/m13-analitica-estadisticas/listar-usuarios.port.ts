import { Usuario } from '../../../entities/usuario.entity';
export interface ListarUsuariosPort { ejecutar(): Promise<Usuario[]>; }
