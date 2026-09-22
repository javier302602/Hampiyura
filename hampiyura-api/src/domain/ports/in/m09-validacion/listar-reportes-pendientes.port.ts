import { Reporte } from '../../../entities/reporte.entity';
export interface ListarReportesPendientesPort { ejecutar(): Promise<Reporte[]>; }
