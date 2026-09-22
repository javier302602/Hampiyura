import { Preparacion } from '../../entities/preparacion.entity';
import { EstadoValidacion } from '../../value-objects/estado-validacion.vo';

// Este puerto era un placeholder ("se declara deliberadamente sin adaptador") desde que se
// construyó M-04; ahora que M-05 existe, se reemplaza por la interfaz real.
export interface PreparacionRepositoryPort {
  guardar(preparacion: Preparacion): Promise<void>;
  buscarPorId(id: string): Promise<Preparacion | null>;
  listarPorParteUso(parteUsoId: string): Promise<Preparacion[]>;
  actualizarEstadoValidacion(id: string, estado: EstadoValidacion): Promise<void>;
}
