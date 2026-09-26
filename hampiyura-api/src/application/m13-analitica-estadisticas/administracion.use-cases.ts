import { Usuario } from '../../domain/entities/usuario.entity';
import { ListarUsuariosPort } from '../../domain/ports/in/m13-analitica-estadisticas/listar-usuarios.port';
import { CambiarEstadoCuentaPort } from '../../domain/ports/in/m13-analitica-estadisticas/cambiar-estado-cuenta.port';
import { EliminarPlantaPort } from '../../domain/ports/in/m13-analitica-estadisticas/eliminar-planta.port';
import { ObtenerPanelAdminPort, PanelAdmin, ResumenConsultas } from '../../domain/ports/in/m13-analitica-estadisticas/obtener-panel-admin.port';
import { ObtenerAuditoriaPort, RegistroAuditoria } from '../../domain/ports/in/m13-analitica-estadisticas/obtener-auditoria.port';
import { UsuarioRepositoryPort } from '../../domain/ports/out/usuario.repository.port';
import { PlantaRepositoryPort } from '../../domain/ports/out/planta.repository.port';
import { CultivoRepositoryPort } from '../../domain/ports/out/cultivo.repository.port';
import { ParteUsoRepositoryPort } from '../../domain/ports/out/parte-uso.repository.port';
import { PublicacionRepositoryPort } from '../../domain/ports/out/publicacion.repository.port';
import { ReporteRepositoryPort } from '../../domain/ports/out/reporte.repository.port';
import { ConsultaRepositoryPort } from '../../domain/ports/out/consulta.repository.port';
import { PagoContactoRepositoryPort } from '../../domain/ports/out/pago-contacto.repository.port';
import { ProductoRepositoryPort } from '../../domain/ports/out/producto.repository.port';
import { rolPuedeValidarTipo } from '../../domain/entities/validacion-contenido.entity';
import { puedeVerArea } from '../m08-consultas/consultas.use-cases';
import { UnauthorizedError } from '../../domain/errors/domain.errors';
import { ValidacionContenidoRepositoryPort } from '../../domain/ports/out/validacion-contenido.repository.port';
import { NotFoundError, ValidationError } from '../../domain/errors/domain.errors';

export class ListarUsuariosUseCase implements ListarUsuariosPort {
  constructor(private readonly repo:UsuarioRepositoryPort) {}
  async ejecutar():Promise<Usuario[]> { return this.repo.listar(); }
}

async function cambiarEstado(repo:UsuarioRepositoryPort, usuarioId:string, estado:Usuario['props']['estado']):Promise<Usuario> {
  const usuario = await repo.buscarPorId(usuarioId);
  if (!usuario) throw new NotFoundError(`Usuario no encontrado: ${usuarioId}`);
  usuario.props.estado = estado;
  await repo.actualizar(usuario);
  return usuario;
}
// RF-30: un usuario suspendido no puede iniciar sesión -- reusa el mismo campo `estado`
// de EstadoCuenta que ya usa M-01 (PendienteActivacion/Activo), en vez de un segundo mecanismo.
export class SuspenderUsuarioUseCase implements CambiarEstadoCuentaPort {
  constructor(private readonly repo:UsuarioRepositoryPort) {}
  async ejecutar(usuarioId:string):Promise<Usuario> { return cambiarEstado(this.repo, usuarioId, 'Suspendido'); }
}
export class ReactivarUsuarioUseCase implements CambiarEstadoCuentaPort {
  constructor(private readonly repo:UsuarioRepositoryPort) {}
  async ejecutar(usuarioId:string):Promise<Usuario> { return cambiarEstado(this.repo, usuarioId, 'Activo'); }
}

// No existía ninguna forma de cambiar el rol de un usuario salvo editando la base de datos a mano
// -- este caso de uso llega solo a través de la ruta PATCH /admin/usuarios/:id/rol, que ya exige
// requireAdmin (role.middleware.ts). Como SOLO un Administrador puede llegar a esta ruta en primer
// lugar, "solo un Administrador puede crear otros Administrador" queda satisfecho por construcción
// -- no hace falta una regla aparte para ese caso particular dentro del caso de uso.
export class CambiarRolUsuarioUseCase {
  constructor(private readonly repo:UsuarioRepositoryPort) {}
  async ejecutar(usuarioId:string, nuevoRol:Usuario['props']['rol']):Promise<Usuario> {
    const usuario = await this.repo.buscarPorId(usuarioId);
    if (!usuario) throw new NotFoundError(`Usuario no encontrado: ${usuarioId}`);
    usuario.props.rol = nuevoRol;
    await this.repo.actualizar(usuario);
    return usuario;
  }
}

// RF-31 (alcance de esta fase): solo eliminar. Editar plantas queda pendiente porque M-02
// todavía no tiene un endpoint de actualización (ver resumen de la sesión).
export class EliminarPlantaUseCase implements EliminarPlantaPort {
  constructor(private readonly plantas:PlantaRepositoryPort, private readonly cultivos:CultivoRepositoryPort, private readonly partesUso:ParteUsoRepositoryPort) {}
  async ejecutar(id:string):Promise<void> {
    if (!(await this.plantas.buscarPorId(id))) throw new NotFoundError(`Planta no encontrada: ${id}`);
    const [fichasCultivo, partesUso] = await Promise.all([this.cultivos.listarPorPlanta(id), this.partesUso.listarPorPlanta(id)]);
    if (fichasCultivo.length > 0 || partesUso.length > 0) throw new ValidationError('No se puede eliminar la planta: tiene fichas de cultivo o combinaciones parte+uso asociadas');
    await this.plantas.eliminar(id);
  }
}

export class ObtenerPanelAdminUseCase implements ObtenerPanelAdminPort {
  constructor(
    private readonly validaciones:ValidacionContenidoRepositoryPort, private readonly usuarios:UsuarioRepositoryPort, private readonly plantas:PlantaRepositoryPort,
    private readonly publicaciones:PublicacionRepositoryPort, private readonly reportes:ReporteRepositoryPort,
    private readonly consultas:ConsultaRepositoryPort, private readonly pagos:PagoContactoRepositoryPort, private readonly productos:ProductoRepositoryPort,
  ) {}
  async ejecutar(rol:string):Promise<PanelAdmin> {
    const esAdmin = rol === 'Administrador';
    if (!esAdmin && !rol.startsWith('Especialista')) throw new UnauthorizedError('Solo el equipo puede ver el panel');
    const [pendientes, porEstado, todasConsultas] = await Promise.all([this.validaciones.listarPendientes(), this.reportes.contarPorEstado(), this.consultas.listar({})]);
    const propias = pendientes.filter((v) => rolPuedeValidarTipo(rol, v.props.tipoEntidad));
    const visibles = todasConsultas.filter((c) => puedeVerArea(rol, c.props.areaAsignada));
    // Pendiente = pendiente; EnRevision = en proceso; Respondida y Cerrada = resuelta (mismo mapeo que la interfaz).
    const consultas:ResumenConsultas = {
      pendientes: visibles.filter((c) => c.props.estado === 'Pendiente').length,
      enProceso: visibles.filter((c) => c.props.estado === 'EnRevision').length,
      resueltas: visibles.filter((c) => c.props.estado === 'Respondida' || c.props.estado === 'Cerrada').length,
    };
    const reportes = { pendientes:porEstado.Pendiente, revisados:porEstado.Revisado, desestimados:porEstado.Desestimado };
    if (!esAdmin) return { alcance:'especialista', validacionesPendientes:propias.length, reportes, consultas };

    const [usuariosRegistrados, usuariosActivos, plantasPublicadas, publicacionesRealizadas, pagos, usuarios, productos] = await Promise.all([
      this.usuarios.contar(), this.usuarios.contarActivos(), this.plantas.contar(), this.publicaciones.contar(), this.pagos.listar(), this.usuarios.listar(), this.productos.listar(),
    ]);
    const ahora = new Date();
    const vigentes = pagos.filter((p) => p.estaVigente(ahora));
    return {
      alcance:'completo',
      validacionesPendientes:pendientes.length,
      usuariosRegistrados, usuariosActivos, plantasPublicadas, publicacionesRealizadas,
      reportes, consultas,
      pagos:{ pendientesDeConfirmar:pagos.filter((p) => p.props.estado === 'Pendiente').length, confirmados:pagos.filter((p) => p.props.estado === 'Confirmado').length, rechazados:pagos.filter((p) => p.props.estado === 'Rechazado').length },
      accesos:{ planesActivos:vigentes.filter((p) => p.props.concepto === 'Plan').length, desbloqueosVigentes:vigentes.filter((p) => p.props.concepto === 'Desbloqueo').length },
      comision:{ porcentaje:5, productoresQueAceptaron:usuarios.filter((u) => !!u.props.aceptoComisionEn).length, productosPublicados:productos.length, ventasRegistradas:false, montoAcumulado:null },
    };
  }
}

// RNF-304: auditoría básica reusando el historial de ValidacionContenido -- solo decisiones ya
// tomadas, más recientes primero.
export class ObtenerAuditoriaUseCase implements ObtenerAuditoriaPort {
  constructor(private readonly validaciones:ValidacionContenidoRepositoryPort) {}
  async ejecutar():Promise<RegistroAuditoria[]> {
    const todas = await this.validaciones.listar();
    return todas.filter(v=>v.props.estado!=='Pendiente').map(v=>v.props).sort((a,b)=>b.fecha.getTime()-a.fecha.getTime());
  }
}
