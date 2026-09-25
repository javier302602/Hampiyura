import { ReporteProps } from '../../../entities/reporte.entity';
import { EstadoReporte } from '../../../value-objects/estado-reporte.vo';
export interface ReporteVisible extends ReporteProps {
  reportadoPor: string;
  // Solo se resuelve para tipoEntidad='Comentario'; null si es otro tipo o el contenido ya no existe.
  contenido: { texto: string; publicacionId: string; autorNombre: string } | null;
}
export interface ListarReportesPort { ejecutar(estado?: EstadoReporte): Promise<ReporteVisible[]>; }
