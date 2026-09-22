import { Usuario } from '../../domain/entities/usuario.entity';
import { ListarUsuariosPort } from '../../domain/ports/in/m13-analitica-estadisticas/listar-usuarios.port';
import { CambiarEstadoCuentaPort } from '../../domain/ports/in/m13-analitica-estadisticas/cambiar-estado-cuenta.port';
import { EliminarPlantaPort } from '../../domain/ports/in/m13-analitica-estadisticas/eliminar-planta.port';
import { ObtenerPanelAdminPort, PanelAdmin } from '../../domain/ports/in/m13-analitica-estadisticas/obtener-panel-admin.port';
import { ObtenerAuditoriaPort, RegistroAuditoria } from '../../domain/ports/in/m13-analitica-estadisticas/obtener-auditoria.port';
import { UsuarioRepositoryPort } from '../../domain/ports/out/usuario.repository.port';
import { PlantaRepositoryPort } from '../../domain/ports/out/planta.repository.port';
import { CultivoRepositoryPort } from '../../domain/ports/out/cultivo.repository.port';
import { ParteUsoRepositoryPort } from '../../domain/ports/out/parte-uso.repository.port';
import { PublicacionRepositoryPort } from '../../domain/ports/out/publicacion.repository.port';
import { ReporteRepositoryPort } from '../../domain/ports/out/reporte.repository.port';
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
  constructor(private readonly validaciones:ValidacionContenidoRepositoryPort, private readonly usuarios:UsuarioRepositoryPort, private readonly plantas:PlantaRepositoryPort, private readonly publicaciones:PublicacionRepositoryPort, private readonly reportes:ReporteRepositoryPort) {}
  async ejecutar():Promise<PanelAdmin> {
    const [pendientes, usuariosRegistrados, usuariosActivos, plantasPublicadas, publicacionesRealizadas, porEstado] = await Promise.all([
      this.validaciones.listarPendientes(), this.usuarios.contar(), this.usuarios.contarActivos(), this.plantas.contar(), this.publicaciones.contar(), this.reportes.contarPorEstado(),
    ]);
    return {
      validacionesPendientes:pendientes.length,
      usuariosRegistrados,
      usuariosActivos,
      plantasPublicadas,
      publicacionesRealizadas,
      reportes:{ pendientes:porEstado.Pendiente, revisados:porEstado.Revisado, desestimados:porEstado.Desestimado },
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
