import { Comentario } from '../../entities/comentario.entity';
export interface ComentarioRepositoryPort {
  guardar(comentario: Comentario): Promise<void>;
  buscarPorId(id: string): Promise<Comentario | null>;
  listarPorPublicacion(publicacionId: string): Promise<Comentario[]>;
}
