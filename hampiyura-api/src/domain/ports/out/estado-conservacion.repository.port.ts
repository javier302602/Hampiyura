import { EstadoConservacion } from '../../entities/estado-conservacion.entity';
import { EstadoValidacion } from '../../value-objects/estado-validacion.vo';
export interface EstadoConservacionRepositoryPort {
  guardar(estado: EstadoConservacion): Promise<void>;
  buscarPorId(id: string): Promise<EstadoConservacion | null>;
  // Solo el registro VALIDADO más reciente de esa planta, si existe -- para enriquecer M-02
  // y para la ficha de conservación pública (nunca uno Pendiente/Observado/Rechazado).
  buscarValidadoPorPlanta(plantaId: string): Promise<EstadoConservacion | null>;
  actualizarEstadoValidacion(id: string, estado: EstadoValidacion): Promise<void>;
}
