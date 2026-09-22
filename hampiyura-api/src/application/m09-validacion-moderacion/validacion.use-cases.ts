import { AprobarContenidoPort } from '../../domain/ports/in/m09-validacion/aprobar-contenido.port';
import { ObservarContenidoPort } from '../../domain/ports/in/m09-validacion/observar-contenido.port';
import { RechazarContenidoPort } from '../../domain/ports/in/m09-validacion/rechazar-contenido.port';
import { ListarPendientesPort, ValidacionPendienteVisible } from '../../domain/ports/in/m09-validacion/listar-pendientes.port';
import { ValidacionContenidoRepositoryPort } from '../../domain/ports/out/validacion-contenido.repository.port';
import { PublicacionRepositoryPort } from '../../domain/ports/out/publicacion.repository.port';
import { PreparacionRepositoryPort } from '../../domain/ports/out/preparacion.repository.port';
import { ParteUsoRepositoryPort } from '../../domain/ports/out/parte-uso.repository.port';
import { ProductoRepositoryPort } from '../../domain/ports/out/producto.repository.port';
import { EstadoConservacionRepositoryPort } from '../../domain/ports/out/estado-conservacion.repository.port';
import { PlantaRepositoryPort } from '../../domain/ports/out/planta.repository.port';
import { UsuarioRepositoryPort } from '../../domain/ports/out/usuario.repository.port';
import { NotificadorPort } from '../../domain/ports/out/notificador.port';
import { RegistroEntidadesValidables } from '../../domain/ports/out/entidad-validable.repository.port';
import { NotFoundError } from '../../domain/errors/domain.errors';
async function cargar(repo:ValidacionContenidoRepositoryPort,id:string) { const item=await repo.buscarPorId(id); if(!item) throw new NotFoundError(`Validación no encontrada: ${id}`); return item; }
// Sincroniza el estado hacia la entidad de origen (Cultivo, ParteUso, ...) según su tipoEntidad,
// reusando el mismo registro de validación de M-09 en vez de crear un mecanismo de aprobación paralelo.
async function sincronizar(validables:RegistroEntidadesValidables, tipoEntidad:string, entidadId:string, estado:Parameters<NonNullable<RegistroEntidadesValidables[string]>['actualizarEstadoValidacion']>[1]) { await validables[tipoEntidad]?.actualizarEstadoValidacion(entidadId, estado); }
export class AprobarContenidoUseCase implements AprobarContenidoPort { constructor(private readonly repo:ValidacionContenidoRepositoryPort, private readonly notificador:NotificadorPort, private readonly validables:RegistroEntidadesValidables={}) {} async ejecutar({validacionId,validadorId,rol}:Parameters<AprobarContenidoPort['ejecutar']>[0]) { const v=await cargar(this.repo,validacionId); v.aprobar(validadorId,rol); await this.repo.guardar(v); await sincronizar(this.validables,v.props.tipoEntidad,v.props.entidadId,v.props.estado); await this.notificador.notificar(v.props.autorId,'contenido_aprobado'); } }
export class ObservarContenidoUseCase implements ObservarContenidoPort { constructor(private readonly repo:ValidacionContenidoRepositoryPort, private readonly notificador:NotificadorPort, private readonly validables:RegistroEntidadesValidables={}) {} async ejecutar({validacionId,validadorId,rol,comentario}:Parameters<ObservarContenidoPort['ejecutar']>[0]) { const v=await cargar(this.repo,validacionId); v.observar(validadorId,comentario,rol); await this.repo.guardar(v); await sincronizar(this.validables,v.props.tipoEntidad,v.props.entidadId,v.props.estado); await this.notificador.notificar(v.props.autorId,'contenido_observado'); } }
export class RechazarContenidoUseCase implements RechazarContenidoPort { constructor(private readonly repo:ValidacionContenidoRepositoryPort, private readonly notificador:NotificadorPort, private readonly validables:RegistroEntidadesValidables={}) {} async ejecutar({validacionId,validadorId,rol,comentario}:Parameters<RechazarContenidoPort['ejecutar']>[0]) { const v=await cargar(this.repo,validacionId); v.rechazar(validadorId,comentario,rol); await this.repo.guardar(v); await sincronizar(this.validables,v.props.tipoEntidad,v.props.entidadId,v.props.estado); await this.notificador.notificar(v.props.autorId,'contenido_rechazado'); } }
// Reconoce Publicacion/Preparacion/Producto/EstadoConservacion para mostrar un texto legible en
// vez de un UUID -- reusa los repos que ya existen (buscarPorId no filtra por visibilidad, así
// que sirve para contenido Pendiente). Cualquier otro tipoEntidad (Cultivo, ParteUso) sigue con
// el mismo fallback de siempre, sin cambios.
export class ListarPendientesUseCase implements ListarPendientesPort {
  constructor(
    private readonly repo:ValidacionContenidoRepositoryPort,
    private readonly publicaciones:PublicacionRepositoryPort,
    private readonly usuarios:UsuarioRepositoryPort,
    private readonly preparaciones:PreparacionRepositoryPort,
    private readonly partesUso:ParteUsoRepositoryPort,
    private readonly productos:ProductoRepositoryPort,
    private readonly estadosConservacion:EstadoConservacionRepositoryPort,
    private readonly plantas:PlantaRepositoryPort,
  ) {}
  async ejecutar():Promise<ValidacionPendienteVisible[]> {
    const pendientes = await this.repo.listarPendientes();
    return Promise.all(pendientes.map(async (v) => ({ ...v.props, etiqueta: await this.etiquetar(v.props) })));
  }
  private async etiquetar(props:Omit<ValidacionPendienteVisible,'etiqueta'>):Promise<string> {
    if (props.tipoEntidad === 'Publicacion') {
      const publicacion = await this.publicaciones.buscarPorId(props.entidadId);
      if (!publicacion) return `Publicacion · ${props.entidadId}`;
      const autor = await this.usuarios.buscarPorId(publicacion.props.autorId);
      return `${publicacion.props.nombreComun}${autor ? ` — por ${autor.props.nombre}` : ''}`;
    }
    if (props.tipoEntidad === 'Preparacion') {
      const preparacion = await this.preparaciones.buscarPorId(props.entidadId);
      if (!preparacion) return `Preparacion · ${props.entidadId}`;
      const parteUso = await this.partesUso.buscarPorId(preparacion.props.parteUsoId);
      const autor = await this.usuarios.buscarPorId(preparacion.props.autorId);
      return `Preparación${parteUso ? ` de ${parteUso.props.parte}` : ''}${autor ? ` — por ${autor.props.nombre}` : ''}`;
    }
    if (props.tipoEntidad === 'Producto') {
      const producto = await this.productos.buscarPorId(props.entidadId);
      if (!producto) return `Producto · ${props.entidadId}`;
      const productor = await this.usuarios.buscarPorId(producto.props.productorId);
      return `${producto.props.nombre}${productor ? ` — por ${productor.props.nombre}` : ''}`;
    }
    if (props.tipoEntidad === 'EstadoConservacion') {
      const estado = await this.estadosConservacion.buscarPorId(props.entidadId);
      if (!estado) return `EstadoConservacion · ${props.entidadId}`;
      const planta = await this.plantas.buscarPorId(estado.props.plantaId);
      const autor = await this.usuarios.buscarPorId(estado.props.autorId);
      return `Conservación de ${planta ? planta.props.nombreComun : estado.props.plantaId} (${estado.props.nivelRiesgo})${autor ? ` — por ${autor.props.nombre}` : ''}`;
    }
    return `${props.tipoEntidad} · ${props.entidadId}`;
  }
}
