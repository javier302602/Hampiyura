import { Publicacion } from '../../entities/publicacion.entity';
import { EstadoValidacion } from '../../value-objects/estado-validacion.vo';
export interface PublicacionRepositoryPort {
  guardar(publicacion: Publicacion): Promise<void>;
  buscarPorId(id: string): Promise<Publicacion | null>;
  listar(): Promise<Publicacion[]>;
  actualizar(publicacion: Publicacion): Promise<void>;
  eliminar(id: string): Promise<void>;
  actualizarEstadoValidacion(id: string, estado: EstadoValidacion): Promise<void>;
  contar(): Promise<number>;
}
