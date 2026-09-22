import { randomUUID } from 'crypto';
import { Comentario } from '../../domain/entities/comentario.entity';
import { Publicacion } from '../../domain/entities/publicacion.entity';
import { Valoracion } from '../../domain/entities/valoracion.entity';
import { ComentarPublicacionInput, ComentarPublicacionPort } from '../../domain/ports/in/m07-comunidad/comentar-publicacion.port';
import { ListarComentariosPort, ComentarioVisible } from '../../domain/ports/in/m07-comunidad/listar-comentarios.port';
import { CalificarPublicacionInput, CalificarPublicacionPort } from '../../domain/ports/in/m07-comunidad/calificar-publicacion.port';
import { ComentarioRepositoryPort } from '../../domain/ports/out/comentario.repository.port';
import { ValoracionRepositoryPort } from '../../domain/ports/out/valoracion.repository.port';
import { PublicacionRepositoryPort } from '../../domain/ports/out/publicacion.repository.port';
import { UsuarioRepositoryPort } from '../../domain/ports/out/usuario.repository.port';
import { NotificadorPort } from '../../domain/ports/out/notificador.port';
import { NotFoundError, ValidationError } from '../../domain/errors/domain.errors';

async function obtenerPublicacionVisible(publicaciones:PublicacionRepositoryPort, publicacionId:string):Promise<Publicacion> {
  const publicacion = await publicaciones.buscarPorId(publicacionId);
  if (!publicacion || !publicacion.esVisiblePublicamente()) throw new ValidationError('No se puede interactuar con una publicación que todavía no ha sido aprobada');
  return publicacion;
}

// RF-13/RF-130: cualquier usuario registrado comenta en una publicación ya visible; una respuesta
// solo puede colgar de un comentario raíz (un nivel de profundidad, no anidamiento infinito).
// RF-51/RF-52: notifica al autor de la publicación (comentario nuevo) y, si es una respuesta,
// también al autor del comentario respondido -- nunca a uno mismo.
export class ComentarPublicacionUseCase implements ComentarPublicacionPort {
  constructor(private readonly repo:ComentarioRepositoryPort, private readonly publicaciones:PublicacionRepositoryPort, private readonly notificador:NotificadorPort) {}
  async ejecutar(input:ComentarPublicacionInput):Promise<Comentario> {
    if (!input.texto?.trim()) throw new ValidationError('El comentario no puede estar vacío');
    const publicacion = await obtenerPublicacionVisible(this.publicaciones, input.publicacionId);
    let padre:Comentario|null = null;
    if (input.comentarioPadreId) {
      padre = await this.repo.buscarPorId(input.comentarioPadreId);
      if (!padre) throw new NotFoundError(`Comentario a responder no encontrado: ${input.comentarioPadreId}`);
      if (padre.props.comentarioPadreId) throw new ValidationError('Solo se admite un nivel de respuesta a un comentario');
    }
    const comentario = new Comentario({ ...input, id:randomUUID(), fecha:new Date() });
    await this.repo.guardar(comentario);
    if (publicacion.props.autorId !== comentario.props.autorId) await this.notificador.notificar(publicacion.props.autorId, 'comentario_nuevo');
    if (padre && padre.props.autorId !== comentario.props.autorId) await this.notificador.notificar(padre.props.autorId, 'respuesta_comentario');
    return comentario;
  }
}
export class ListarComentariosUseCase implements ListarComentariosPort {
  constructor(private readonly repo:ComentarioRepositoryPort, private readonly usuarios:UsuarioRepositoryPort) {}
  async ejecutar(publicacionId:string):Promise<ComentarioVisible[]> {
    const comentarios = await this.repo.listarPorPublicacion(publicacionId);
    return Promise.all(comentarios.map(async (c) => {
      const autor = await this.usuarios.buscarPorId(c.props.autorId);
      return { ...c.props, autorNombre: autor?.props.nombre ?? c.props.autorId };
    }));
  }
}

// RF-14: calificar dos veces actualiza la valoración anterior, no crea una segunda fila.
// RF-193: notifica al autor de la publicación cuando recibe una calificación (nunca a uno mismo).
export class CalificarPublicacionUseCase implements CalificarPublicacionPort {
  constructor(private readonly repo:ValoracionRepositoryPort, private readonly publicaciones:PublicacionRepositoryPort, private readonly notificador:NotificadorPort) {}
  async ejecutar(input:CalificarPublicacionInput):Promise<Valoracion> {
    const publicacion = await obtenerPublicacionVisible(this.publicaciones, input.publicacionId);
    const existente = await this.repo.buscarPorAutorYPublicacion(input.autorId, input.publicacionId);
    const valoracion = existente
      ? new Valoracion({ ...existente.props, estrellas:input.estrellas })
      : new Valoracion({ id:randomUUID(), publicacionId:input.publicacionId, autorId:input.autorId, estrellas:input.estrellas });
    if (existente) await this.repo.actualizar(valoracion); else await this.repo.guardar(valoracion);
    if (publicacion.props.autorId !== input.autorId) await this.notificador.notificar(publicacion.props.autorId, 'calificacion_nueva');
    return valoracion;
  }
}
