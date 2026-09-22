import { Reporte } from '../../../entities/reporte.entity';
export type AccionReporte = 'Revisado' | 'Desestimado';
export interface ActualizarEstadoReportePort { ejecutar(id: string, accion: AccionReporte): Promise<Reporte>; }
