import { Comentario } from '../../../entities/comentario.entity';
export type ComentarPublicacionInput = { publicacionId: string; autorId: string; texto: string; comentarioPadreId?: string };
export interface ComentarPublicacionPort { ejecutar(input: ComentarPublicacionInput): Promise<Comentario>; }
