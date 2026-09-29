import { Pedido } from '../../entities/pedido.entity';

export interface CobroProductoDatos { productoId: string; yape?: string; plin?: string; cuenta?: string; entregaDias: number; compromisoEn: Date }
export interface CobroProductoRepositoryPort {
  obtener(productoId: string): Promise<CobroProductoDatos | null>;
  guardar(c: CobroProductoDatos): Promise<void>; // upsert
}
export interface PedidoRepositoryPort {
  guardar(p: Pedido): Promise<void>;
  actualizar(p: Pedido): Promise<void>;
  buscarPorId(id: string): Promise<Pedido | null>;
  listarDe(usuarioId: string, rol: 'comprador' | 'vendedor'): Promise<Pedido[]>;
  listarPorEstado(estado: string): Promise<Pedido[]>;
}
