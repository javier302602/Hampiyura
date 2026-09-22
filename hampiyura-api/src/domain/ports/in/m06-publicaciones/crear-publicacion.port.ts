import { Publicacion } from '../../../entities/publicacion.entity';
export type CrearPublicacionInput = Omit<Publicacion['props'], 'id' | 'estadoValidacion' | 'fechaPublicacion'>;
export interface CrearPublicacionPort { ejecutar(input: CrearPublicacionInput): Promise<Publicacion>; }
