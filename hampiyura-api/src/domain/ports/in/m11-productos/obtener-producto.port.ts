import { Producto } from '../../../entities/producto.entity';
// Las 3 etiquetas viajan explícitas e independientes (RF-272): revisadoPorEquipo se deriva de
// estadoValidacion; etiquetaValidadoDocumental y etiquetaCertificado son campos propios.
// `plantasNombres`/`productorNombre`: no venían en ninguna respuesta (solo plantasIds/productorId,
// UUIDs) -- se resuelven vía PlantaRepositoryPort/UsuarioRepositoryPort, mismo patrón que
// autorNombre en Publicacion/Comentario, para que el directorio/detalle sea legible sin llamadas
// adicionales del frontend.
export type ProductoVisible = Producto['props'] & { revisadoPorEquipo: boolean; plantasNombres: string[]; productorNombre: string };
export interface ObtenerProductoPort { ejecutar(id: string): Promise<ProductoVisible>; }
