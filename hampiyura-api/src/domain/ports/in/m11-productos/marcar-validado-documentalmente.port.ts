import { Producto } from '../../../entities/producto.entity';
export interface MarcarValidadoDocumentalmentePort { ejecutar(id: string): Promise<Producto>; }
