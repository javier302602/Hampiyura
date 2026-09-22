import { randomUUID } from 'crypto';
import { Consulta, calcularPrioridad } from '../../domain/entities/consulta.entity';
import { MensajeConsulta } from '../../domain/entities/mensaje-consulta.entity';
import { CrearConsultaInput, CrearConsultaPort } from '../../domain/ports/in/m08-consultas/crear-consulta.port';
import { ListarBandejaConsultasPort } from '../../domain/ports/in/m08-consultas/listar-bandeja-consultas.port';
import { ListarMisConsultasPort } from '../../domain/ports/in/m08-consultas/listar-mis-consultas.port';
import { ObtenerConsultaPort, ConsultaConHilo } from '../../domain/ports/in/m08-consultas/obtener-consulta.port';
import { AgregarMensajeConsultaInput, AgregarMensajeConsultaPort } from '../../domain/ports/in/m08-consultas/agregar-mensaje-consulta.port';
import { CerrarConsultaPort } from '../../domain/ports/in/m08-consultas/cerrar-consulta.port';
import { ReabrirConsultaPort } from '../../domain/ports/in/m08-consultas/reabrir-consulta.port';
import { AsignarConsultaPort } from '../../domain/ports/in/m08-consultas/asignar-consulta.port';
import { ConsultaRepositoryPort, FiltrosBandejaConsultas } from '../../domain/ports/out/consulta.repository.port';
import { MensajeConsultaRepositoryPort } from '../../domain/ports/out/mensaje-consulta.repository.port';
import { UsuarioRepositoryPort } from '../../domain/ports/out/usuario.repository.port';
import { NotificadorPort } from '../../domain/ports/out/notificador.port';
import { esTipoConsulta, TipoConsulta } from '../../domain/value-objects/tipo-consulta.vo';
import { AreaEspecialidad, areaDelRol } from '../../domain/value-objects/area-especialidad.vo';
import { NotFoundError, UnauthorizedError, ValidationError } from '../../domain/errors/domain.errors';

function esRolDeEquipo(rol: string): boolean { return rol === 'Administrador' || rol.startsWith('Especialista'); }

// Solo 2 de los 7 tipos tienen un área obviamente asociada al nombre del propio tipo (coinciden
// con módulos ya existentes: Conservación=M-10, Cultivo=M-03/agronomía). El resto se deja sin área
// -- no se inventa una regla de enrutamiento que no esté en el SDS.
function enrutarArea(tipo: TipoConsulta): AreaEspecialidad | undefined {
  if (tipo === 'ReportePlantaEnPeligro') return 'Conservacion';
  if (tipo === 'ReporteProblemaCultivo') return 'Agronomia';
  return undefined;
}

// RN-05 (mismo principio aplicado a M-08): Administrador ve todo; un especialista con área
// conocida ve su propia área y las consultas sin área asignada (para poder triarlas); un
// especialista sin área mapeada (rol no reconocido en areaDelRol) solo ve las sin área asignada.
function puedeVerArea(rolSolicitante: string, areaConsulta: AreaEspecialidad | undefined): boolean {
  if (rolSolicitante === 'Administrador') return true;
  if (!areaConsulta) return true;
  return areaDelRol(rolSolicitante) === areaConsulta;
}

export class CrearConsultaUseCase implements CrearConsultaPort {
  constructor(private readonly repo: ConsultaRepositoryPort) {}
  async ejecutar(input: CrearConsultaInput): Promise<Consulta> {
    if (!esTipoConsulta(input.tipo)) throw new ValidationError(`Tipo de consulta no reconocido: ${input.tipo}`);
    if (!input.descripcion?.trim()) throw new ValidationError('La descripción de la consulta es obligatoria');
    const ahora = new Date();
    const consulta = new Consulta({
      id: randomUUID(),
      autorId: input.autorId,
      tipo: input.tipo,
      descripcion: input.descripcion,
      estado: 'Pendiente',
      prioridad: calcularPrioridad(input.tipo),
      areaAsignada: enrutarArea(input.tipo),
      fechaCreacion: ahora,
      fechaActualizacion: ahora,
    });
    await this.repo.guardar(consulta);
    return consulta;
  }
}

// Cierre por inactividad (RF-266, ver Consulta.cerrarPorInactividadSiCorresponde): resuelto de
// forma perezosa, así que cualquier camino que cargue una consulta debe pasar por aquí primero
// para que el estado que se muestra (y persiste) esté siempre al día, sin depender de un cron.
async function aplicarCierrePorInactividad(repo: ConsultaRepositoryPort, consulta: Consulta, ahora: Date): Promise<Consulta> {
  if (consulta.cerrarPorInactividadSiCorresponde(ahora)) await repo.actualizar(consulta);
  return consulta;
}

export class ListarBandejaConsultasUseCase implements ListarBandejaConsultasPort {
  constructor(private readonly repo: ConsultaRepositoryPort) {}
  async ejecutar(rolSolicitante: string, filtros: FiltrosBandejaConsultas): Promise<Consulta[]> {
    if (!esRolDeEquipo(rolSolicitante)) throw new UnauthorizedError('Solo un administrador o especialista puede ver la bandeja de consultas');
    // Si pide explícitamente un área que no es la suya (y no es Administrador), no hay nada que
    // mostrarle -- se resuelve como lista vacía en vez de un error, mismo criterio que un filtro
    // normal que simplemente no encuentra coincidencias.
    if (filtros.area && !puedeVerArea(rolSolicitante, filtros.area)) return [];
    const todas = await this.repo.listar(filtros);
    const ahora = new Date();
    const actualizadas = await Promise.all(todas.map((c) => aplicarCierrePorInactividad(this.repo, c, ahora)));
    return actualizadas.filter((c) => puedeVerArea(rolSolicitante, c.props.areaAsignada));
  }
}

export class ListarMisConsultasUseCase implements ListarMisConsultasPort {
  constructor(private readonly repo: ConsultaRepositoryPort, private readonly usuarios: UsuarioRepositoryPort) {}
  async ejecutar(autorId: string): Promise<Consulta[]> {
    const usuario = await this.usuarios.buscarPorId(autorId);
    if (!usuario) throw new NotFoundError('Usuario no encontrado');
    if (usuario.props.estado !== 'Activo') throw new UnauthorizedError('Tu cuenta debe estar activa para ver tu historial de consultas');
    const consultas = await this.repo.listarPorAutor(autorId);
    const ahora = new Date();
    return Promise.all(consultas.map((c) => aplicarCierrePorInactividad(this.repo, c, ahora)));
  }
}

async function cargarConAcceso(repo: ConsultaRepositoryPort, id: string, solicitanteId: string, rolSolicitante: string): Promise<Consulta> {
  const consulta = await repo.buscarPorId(id);
  if (!consulta) throw new NotFoundError(`Consulta no encontrada: ${id}`);
  await aplicarCierrePorInactividad(repo, consulta, new Date());
  const esAutor = consulta.props.autorId === solicitanteId;
  const esEquipoConAcceso = esRolDeEquipo(rolSolicitante) && puedeVerArea(rolSolicitante, consulta.props.areaAsignada);
  if (!esAutor && !esEquipoConAcceso) throw new UnauthorizedError('No tienes acceso a esta consulta');
  return consulta;
}

export class ObtenerConsultaUseCase implements ObtenerConsultaPort {
  constructor(private readonly repo: ConsultaRepositoryPort, private readonly mensajes: MensajeConsultaRepositoryPort) {}
  async ejecutar(id: string, solicitanteId: string, rolSolicitante: string): Promise<ConsultaConHilo> {
    const consulta = await cargarConAcceso(this.repo, id, solicitanteId, rolSolicitante);
    const hilo = await this.mensajes.listarPorConsulta(id);
    return { consulta, mensajes: hilo };
  }
}

// RF-263 (criterio de aceptación): notifica al autor cuando el estado cambia por un mensaje del
// equipo -- reusa el NotificadorPort/PersistenteNotificadorAdapter ya construidos en M-14, no se
// inventa un mecanismo nuevo. Sin autorId (consulta de visitante), no hay a quién notificar.
export class AgregarMensajeConsultaUseCase implements AgregarMensajeConsultaPort {
  constructor(
    private readonly repo: ConsultaRepositoryPort,
    private readonly mensajes: MensajeConsultaRepositoryPort,
    private readonly notificador: NotificadorPort,
  ) {}
  async ejecutar(input: AgregarMensajeConsultaInput): Promise<MensajeConsulta> {
    if (!input.contenido?.trim()) throw new ValidationError('El mensaje no puede estar vacío');
    const consulta = await cargarConAcceso(this.repo, input.consultaId, input.autorId, input.rolAutor);
    const esEquipo = esRolDeEquipo(input.rolAutor);
    const estadoAnterior = consulta.props.estado;
    const ahora = new Date();
    if (esEquipo) consulta.registrarMensajeDelEquipo(ahora); else consulta.registrarMensajeDelAutor(ahora);
    await this.repo.actualizar(consulta);
    const mensaje = new MensajeConsulta({ id: randomUUID(), consultaId: input.consultaId, autorId: input.autorId, contenido: input.contenido, esEquipo, fecha: ahora });
    await this.mensajes.guardar(mensaje);
    if (esEquipo && consulta.props.autorId && consulta.props.estado !== estadoAnterior) {
      const tipoNotificacion = consulta.props.estado === 'EnRevision' ? 'consulta_en_revision' : 'consulta_respondida';
      await this.notificador.notificar(consulta.props.autorId, tipoNotificacion, { entidadTipo: 'Consulta', entidadId: consulta.props.id });
    }
    return mensaje;
  }
}

export class CerrarConsultaUseCase implements CerrarConsultaPort {
  constructor(private readonly repo: ConsultaRepositoryPort) {}
  async ejecutar(id: string, solicitanteId: string, rolSolicitante: string): Promise<Consulta> {
    const consulta = await cargarConAcceso(this.repo, id, solicitanteId, rolSolicitante);
    consulta.cerrar(new Date());
    await this.repo.actualizar(consulta);
    return consulta;
  }
}
export class ReabrirConsultaUseCase implements ReabrirConsultaPort {
  constructor(private readonly repo: ConsultaRepositoryPort) {}
  async ejecutar(id: string, solicitanteId: string, rolSolicitante: string): Promise<Consulta> {
    const consulta = await cargarConAcceso(this.repo, id, solicitanteId, rolSolicitante);
    consulta.reabrir(new Date());
    await this.repo.actualizar(consulta);
    return consulta;
  }
}

// Asignación manual de una consulta de la bandeja a un especialista/administrador específico. Solo
// Administrador puede asignar (un especialista no se autoasigna) y solo a alguien del equipo --
// evita asignar por error a un visitante o usuario regular cualquiera.
export class AsignarConsultaUseCase implements AsignarConsultaPort {
  constructor(private readonly repo: ConsultaRepositoryPort, private readonly usuarios: UsuarioRepositoryPort) {}
  async ejecutar(id: string, especialistaId: string, solicitanteId: string, rolSolicitante: string): Promise<Consulta> {
    if (rolSolicitante !== 'Administrador') throw new UnauthorizedError('Solo un administrador puede asignar una consulta');
    const consulta = await cargarConAcceso(this.repo, id, solicitanteId, rolSolicitante);
    const especialista = await this.usuarios.buscarPorId(especialistaId);
    if (!especialista || !esRolDeEquipo(especialista.props.rol)) throw new ValidationError('Solo se puede asignar a un administrador o especialista del equipo');
    consulta.asignar(especialistaId, new Date());
    await this.repo.actualizar(consulta);
    return consulta;
  }
}
