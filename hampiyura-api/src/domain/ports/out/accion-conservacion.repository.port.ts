import { AccionConservacion } from '../../entities/accion-conservacion.entity';
export interface AccionConservacionRepositoryPort {
  guardar(accion: AccionConservacion): Promise<void>;
  listarPorPlanta(plantaId: string): Promise<AccionConservacion[]>;
}
