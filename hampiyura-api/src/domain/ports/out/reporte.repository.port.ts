import { Reporte } from '../../entities/reporte.entity';
import { EstadoReporte } from '../../value-objects/estado-reporte.vo';
export interface ReporteRepositoryPort {
  guardar(reporte: Reporte): Promise<void>;
  buscarPorId(id: string): Promise<Reporte | null>;
  listarPendientes(): Promise<Reporte[]>;
  actualizar(reporte: Reporte): Promise<void>;
  // RF-189: resumen agregado para el panel admin -- no es un informe nuevo, solo un conteo por estado.
  contarPorEstado(): Promise<Record<EstadoReporte, number>>;
}
