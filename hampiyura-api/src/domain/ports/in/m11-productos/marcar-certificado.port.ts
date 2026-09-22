import { Producto } from '../../../entities/producto.entity';
export interface MarcarCertificadoPort { ejecutar(id: string, documentacion: string): Promise<Producto>; }
