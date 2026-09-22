import { Publicacion } from '../../../entities/publicacion.entity';

// RF-14: el promedio de estrellas viaja junto con la publicación. RF-257 (reusado): verificado/
// advertencia igual que en M-04, para que nunca se muestre como hecho médico verificado sin serlo.
// `autorNombre`: no venía en ninguna respuesta (solo el autorId, un UUID) -- se resuelve vía
// UsuarioRepositoryPort para que el feed/detalle sea legible; si el usuario no existe, cae a autorId.
// `miValoracion`: la calificación (1-5) que el usuario AUTENTICADO que pide esta ficha ya haya
// puesto, o null si no calificó o si la petición es anónima -- así el frontend puede mostrarla
// precargada en vez de adivinar o duplicarla.
// `totalComentarios`: tampoco venía en ninguna respuesta -- se cuenta vía ComentarioRepositoryPort
// (listarPorPublicacion, que ya existe para M-07) para que el feed muestre el número sin que el
// frontend tenga que pedir el hilo completo de cada publicación solo para contarlo.
export type PublicacionVisible = Publicacion['props'] & { verificado: boolean; advertencia: string | null; promedioEstrellas: number | null; totalValoraciones: number; autorNombre: string; miValoracion: number | null; totalComentarios: number };

export interface ObtenerPublicacionPort { ejecutar(id: string, usuarioId?: string): Promise<PublicacionVisible>; }
