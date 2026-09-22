import { Usuario } from '../../../entities/usuario.entity';
export interface CambiarEstadoCuentaPort { ejecutar(usuarioId: string): Promise<Usuario>; }
