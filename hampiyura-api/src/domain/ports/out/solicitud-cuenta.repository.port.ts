import { SolicitudCuenta } from '../../entities/solicitud-cuenta.entity';
import { EstadoValidacion } from '../../value-objects/estado-validacion.vo';
export interface SolicitudCuentaRepositoryPort {
  guardar(s: SolicitudCuenta): Promise<void>;
  buscarPorId(id: string): Promise<SolicitudCuenta | null>;
  listarPorUsuario(usuarioId: string): Promise<SolicitudCuenta[]>;
  actualizarEstadoValidacion(id: string, estado: EstadoValidacion): Promise<void>;
}
