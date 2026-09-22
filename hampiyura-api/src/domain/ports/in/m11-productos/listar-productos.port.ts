import { ProductoVisible } from './obtener-producto.port';
// RF-275 (Should, filtro simple implementado): explorar productos publicados por localidad o planta.
export type FiltrosProductos = { localidad?: string; plantaId?: string };
export interface ListarProductosPort { ejecutar(filtros?: FiltrosProductos): Promise<ProductoVisible[]>; }
