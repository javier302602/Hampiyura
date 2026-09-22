import { Notificacion } from '../../domain/entities/notificacion.entity';
import { ListarNotificacionesPort } from '../../domain/ports/in/m14-seguridad-notificaciones/listar-notificaciones.port';
import { MarcarTodasLeidasPort } from '../../domain/ports/in/m14-seguridad-notificaciones/marcar-todas-leidas.port';
import { MarcarLeidaPort } from '../../domain/ports/in/m14-seguridad-notificaciones/marcar-leida.port';
import { EliminarNotificacionPort } from '../../domain/ports/in/m14-seguridad-notificaciones/eliminar-notificacion.port';
import { NotificacionRepositoryPort } from '../../domain/ports/out/notificacion.repository.port';

// RF-56/195: centro de notificaciones del usuario autenticado.
export class ListarNotificacionesUseCase implements ListarNotificacionesPort {
  constructor(private readonly repo:NotificacionRepositoryPort) {}
  async ejecutar(usuarioId:string):Promise<Notificacion[]> { return this.repo.listarPorUsuario(usuarioId); }
}
// RF-196
export class MarcarTodasLeidasUseCase implements MarcarTodasLeidasPort {
  constructor(private readonly repo:NotificacionRepositoryPort) {}
  async ejecutar(usuarioId:string):Promise<void> { await this.repo.marcarTodasLeidas(usuarioId); }
}
// Marca una notificación individual (no existía en FASE 7, se agrega para el centro de
// notificaciones del frontend -- ver decisión en el resumen de la sesión).
export class MarcarLeidaUseCase implements MarcarLeidaPort {
  constructor(private readonly repo:NotificacionRepositoryPort) {}
  async ejecutar(id:string, usuarioId:string):Promise<void> { await this.repo.marcarLeida(id, usuarioId); }
}
// RF-197 (Could, implementado igual)
export class EliminarNotificacionUseCase implements EliminarNotificacionPort {
  constructor(private readonly repo:NotificacionRepositoryPort) {}
  async ejecutar(id:string, usuarioId:string):Promise<void> { await this.repo.eliminarDeUsuario(id, usuarioId); }
}
