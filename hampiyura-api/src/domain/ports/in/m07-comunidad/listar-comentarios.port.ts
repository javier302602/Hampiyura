import { Comentario } from '../../../entities/comentario.entity';

// `autorNombre`: no venía en ninguna respuesta (solo autorId, un UUID) -- se resuelve vía
// UsuarioRepositoryPort igual que en publicaciones (obtener-publicacion.port.ts), para que el hilo
// de comentarios sea legible sin que el frontend tenga que resolver usuarios por su cuenta.
export type ComentarioVisible = Comentario['props'] & { autorNombre: string };

export interface ListarComentariosPort { ejecutar(publicacionId: string): Promise<ComentarioVisible[]>; }
