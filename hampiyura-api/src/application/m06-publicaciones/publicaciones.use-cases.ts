import { randomUUID } from 'crypto';
import { Publicacion } from '../../domain/entities/publicacion.entity';
import { ValidacionContenido } from '../../domain/entities/validacion-contenido.entity';
import { CrearPublicacionInput, CrearPublicacionPort } from '../../domain/ports/in/m06-publicaciones/crear-publicacion.port';
import { ObtenerPublicacionPort, PublicacionVisible } from '../../domain/ports/in/m06-publicaciones/obtener-publicacion.port';
import { ListarPublicacionesPort } from '../../domain/ports/in/m06-publicaciones/listar-publicaciones.port';
import { EditarPublicacionInput, EditarPublicacionPort } from '../../domain/ports/in/m06-publicaciones/editar-publicacion.port';
import { EliminarPublicacionPort } from '../../domain/ports/in/m06-publicaciones/eliminar-publicacion.port';
import { SubirMediaInput, SubirMediaPort } from '../../domain/ports/in/m06-publicaciones/subir-media.port';
import { PublicacionRepositoryPort } from '../../domain/ports/out/publicacion.repository.port';
import { ValoracionRepositoryPort } from '../../domain/ports/out/valoracion.repository.port';
import { ComentarioRepositoryPort } from '../../domain/ports/out/comentario.repository.port';
import { ValidacionContenidoRepositoryPort } from '../../domain/ports/out/validacion-contenido.repository.port';
import { PlantaRepositoryPort } from '../../domain/ports/out/planta.repository.port';
import { UsuarioRepositoryPort } from '../../domain/ports/out/usuario.repository.port';
import { AlmacenamientoMediaPort } from '../../domain/ports/out/almacenamiento-media.port';
import { NotificadorPort } from '../../domain/ports/out/notificador.port';
import { esTipoConocimiento } from '../../domain/value-objects/tipo-conocimiento.vo';
import { NotFoundError, UnauthorizedError, ValidationError } from '../../domain/errors/domain.errors';

async function calcularValoracion(valoraciones:ValoracionRepositoryPort, publicacionId:string):Promise<{promedioEstrellas:number|null; totalValoraciones:number}> {
  const items = await valoraciones.listarPorPublicacion(publicacionId);
  if (items.length === 0) return { promedioEstrellas:null, totalValoraciones:0 };
  const promedio = items.reduce((acc,v)=>acc+v.props.estrellas,0) / items.length;
  return { promedioEstrellas:Math.round(promedio*10)/10, totalValoraciones:items.length };
}
async function aVistaPublicacion(publicacion:Publicacion, valoraciones:ValoracionRepositoryPort, usuarios:UsuarioRepositoryPort, comentarios:ComentarioRepositoryPort, usuarioId?:string):Promise<PublicacionVisible> {
  const resumen = await calcularValoracion(valoraciones, publicacion.props.id);
  const autor = await usuarios.buscarPorId(publicacion.props.autorId);
  const miValoracionExistente = usuarioId ? await valoraciones.buscarPorAutorYPublicacion(usuarioId, publicacion.props.id) : null;
  const totalComentarios = (await comentarios.listarPorPublicacion(publicacion.props.id)).length;
  return { ...publicacion.props, verificado:publicacion.puedeMostrarseComoVerificado(), advertencia:publicacion.etiquetaAdvertencia(), ...resumen, autorNombre:autor?.props.nombre ?? publicacion.props.autorId, miValoracion:miValoracionExistente?.props.estrellas ?? null, totalComentarios };
}

export class CrearPublicacionUseCase implements CrearPublicacionPort {
  constructor(private readonly repo:PublicacionRepositoryPort, private readonly plantas:PlantaRepositoryPort, private readonly validaciones:ValidacionContenidoRepositoryPort) {}
  async ejecutar(input:CrearPublicacionInput):Promise<Publicacion> {
    if (!input.nombreComun?.trim()) throw new ValidationError('El nombre común es obligatorio');
    if (!input.descripcion?.trim()) throw new ValidationError('La descripción es obligatoria');
    if (!input.enfermedadesTratadas?.trim()) throw new ValidationError('Debes indicar qué enfermedades ayuda a tratar');
    if (!input.formaPreparacion?.trim()) throw new ValidationError('La forma de preparación es obligatoria');
    if (!esTipoConocimiento(input.tipoConocimiento)) throw new ValidationError(`Tipo de conocimiento no reconocido: ${input.tipoConocimiento}`);
    if (!(await this.plantas.buscarPorId(input.plantaId))) throw new ValidationError(`La planta indicada no existe en el catálogo: ${input.plantaId}`);
    const publicacion = new Publicacion({ ...input, id:randomUUID(), fechaPublicacion:new Date(), estadoValidacion:'Pendiente' });
    await this.repo.guardar(publicacion);
    await this.validaciones.guardar(new ValidacionContenido({ id:randomUUID(), tipoEntidad:'Publicacion', entidadId:publicacion.props.id, estado:'Pendiente', fecha:new Date(), autorId:publicacion.props.autorId }));
    return publicacion;
  }
}

export class ObtenerPublicacionUseCase implements ObtenerPublicacionPort {
  constructor(private readonly repo:PublicacionRepositoryPort, private readonly valoraciones:ValoracionRepositoryPort, private readonly usuarios:UsuarioRepositoryPort, private readonly comentarios:ComentarioRepositoryPort) {}
  async ejecutar(id:string, usuarioId?:string):Promise<PublicacionVisible> {
    const publicacion = await this.repo.buscarPorId(id);
    if (!publicacion || !publicacion.esVisiblePublicamente()) throw new NotFoundError(`Publicación no encontrada: ${id}`);
    return aVistaPublicacion(publicacion, this.valoraciones, this.usuarios, this.comentarios, usuarioId);
  }
}

export class ListarPublicacionesUseCase implements ListarPublicacionesPort {
  constructor(private readonly repo:PublicacionRepositoryPort, private readonly valoraciones:ValoracionRepositoryPort, private readonly usuarios:UsuarioRepositoryPort, private readonly comentarios:ComentarioRepositoryPort) {}
  async ejecutar():Promise<PublicacionVisible[]> {
    const todas = await this.repo.listar();
    const visibles = todas.filter(p=>p.esVisiblePublicamente());
    return Promise.all(visibles.map(p=>aVistaPublicacion(p, this.valoraciones, this.usuarios, this.comentarios)));
  }
}

export class EditarPublicacionUseCase implements EditarPublicacionPort {
  constructor(private readonly repo:PublicacionRepositoryPort, private readonly validaciones:ValidacionContenidoRepositoryPort) {}
  async ejecutar(id:string, solicitanteId:string, cambios:EditarPublicacionInput):Promise<Publicacion> {
    const publicacion = await this.repo.buscarPorId(id);
    if (!publicacion) throw new NotFoundError(`Publicación no encontrada: ${id}`);
    if (publicacion.props.autorId !== solicitanteId) throw new UnauthorizedError('Solo el autor puede editar esta publicación');
    if (cambios.tipoConocimiento && !esTipoConocimiento(cambios.tipoConocimiento)) throw new ValidationError(`Tipo de conocimiento no reconocido: ${cambios.tipoConocimiento}`);
    // Editar contenido ya aprobado lo regresa a revisión: no debe quedar "Validado" con datos que
    // un especialista nunca llegó a ver (decisión no especificada explícitamente, ver resumen).
    Object.assign(publicacion.props, cambios, { estadoValidacion:'Pendiente' as const });
    await this.repo.actualizar(publicacion);
    await this.validaciones.guardar(new ValidacionContenido({ id:randomUUID(), tipoEntidad:'Publicacion', entidadId:publicacion.props.id, estado:'Pendiente', fecha:new Date(), autorId:publicacion.props.autorId }));
    return publicacion;
  }
}

// RF-54: solo notifica cuando la elimina un moderador (no cuando el propio autor borra la suya).
export class EliminarPublicacionUseCase implements EliminarPublicacionPort {
  constructor(private readonly repo:PublicacionRepositoryPort, private readonly notificador:NotificadorPort) {}
  async ejecutar(id:string, solicitanteId:string, rol:string):Promise<void> {
    const publicacion = await this.repo.buscarPorId(id);
    if (!publicacion) throw new NotFoundError(`Publicación no encontrada: ${id}`);
    const esPropia = publicacion.props.autorId === solicitanteId;
    if (rol !== 'Administrador' && !esPropia) throw new UnauthorizedError('Solo el autor o un administrador pueden eliminar esta publicación');
    await this.repo.eliminar(id);
    if (!esPropia) await this.notificador.notificar(publicacion.props.autorId, 'publicacion_eliminada_moderacion');
  }
}

export class SubirMediaUseCase implements SubirMediaPort {
  constructor(private readonly almacenamiento:AlmacenamientoMediaPort) {}
  async ejecutar(input:SubirMediaInput):Promise<{url:string}> {
    if (!input.nombreOriginal?.trim()) throw new ValidationError('El nombre del archivo es obligatorio');
    const url = await this.almacenamiento.guardar(input.nombreOriginal, input.contenidoBase64);
    return { url };
  }
}
