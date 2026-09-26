import { PagoContacto, EstadoPagoRegistrado } from '../../entities/pago-contacto.entity';

export interface PagoContactoRepositoryPort {
  guardar(pago: PagoContacto): Promise<void>;
  actualizar(pago: PagoContacto): Promise<void>;
  buscarPorId(id: string): Promise<PagoContacto | null>;
  listarPorUsuario(usuarioId: string): Promise<PagoContacto[]>;
  // Bandeja de administración: todos o por estado guardado, más recientes primero.
  listar(estado?: EstadoPagoRegistrado): Promise<PagoContacto[]>;
}
