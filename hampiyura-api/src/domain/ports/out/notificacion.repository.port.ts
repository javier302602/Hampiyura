import { Notificacion } from '../../entities/notificacion.entity';
export interface NotificacionRepositoryPort {
  guardar(notificacion: Notificacion): Promise<void>;
  listarPorUsuario(usuarioId: string): Promise<Notificacion[]>;
  marcarTodasLeidas(usuarioId: string): Promise<void>;
  // Mismo criterio de seguridad que eliminarDeUsuario: solo marca si la notificación es del propio usuario.
  marcarLeida(id: string, usuarioId: string): Promise<void>;
  // RF-197 (Could, implementado igual): solo elimina si la notificación es del propio usuario.
  eliminarDeUsuario(id: string, usuarioId: string): Promise<void>;
}
