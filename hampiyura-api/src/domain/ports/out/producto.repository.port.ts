import { Producto } from '../../entities/producto.entity';
import { EstadoValidacion } from '../../value-objects/estado-validacion.vo';
export interface ProductoRepositoryPort {
  guardar(producto: Producto): Promise<void>;
  buscarPorId(id: string): Promise<Producto | null>;
  listar(): Promise<Producto[]>;
  actualizar(producto: Producto): Promise<void>;
  actualizarEstadoValidacion(id: string, estado: EstadoValidacion): Promise<void>;
}
