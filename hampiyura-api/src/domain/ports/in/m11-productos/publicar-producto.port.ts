import { Producto } from '../../../entities/producto.entity';
export type PublicarProductoInput = Omit<Producto['props'], 'id' | 'estadoValidacion' | 'requiereRevisionReforzada' | 'etiquetaValidadoDocumental' | 'etiquetaCertificado' | 'documentacionCertificacion'>;
export interface PublicarProductoPort { ejecutar(input: PublicarProductoInput): Promise<Producto>; }
