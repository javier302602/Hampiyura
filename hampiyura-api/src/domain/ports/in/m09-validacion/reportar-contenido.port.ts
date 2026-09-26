import { CategoriaReporte } from '../../../value-objects/categoria-reporte.vo';
import { Reporte } from '../../../entities/reporte.entity';
export type ReportarContenidoInput = { tipoEntidad: string; entidadId: string; autorId: string; motivo: string; categoria?: CategoriaReporte };
export interface ReportarContenidoPort { ejecutar(input: ReportarContenidoInput): Promise<Reporte>; }
