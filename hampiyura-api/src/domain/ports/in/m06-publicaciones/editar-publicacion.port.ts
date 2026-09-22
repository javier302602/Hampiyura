import { Publicacion } from '../../../entities/publicacion.entity';
export type EditarPublicacionInput = Partial<Pick<Publicacion['props'], 'nombreComun' | 'descripcion' | 'enfermedadesTratadas' | 'formaPreparacion' | 'imagenes' | 'tipoConocimiento' | 'fuente'>>;
export interface EditarPublicacionPort { ejecutar(id: string, solicitanteId: string, cambios: EditarPublicacionInput): Promise<Publicacion>; }
