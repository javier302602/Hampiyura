import { Reporte } from '../../../entities/reporte.entity';
export type ReportarContenidoInput = { tipoEntidad: string; entidadId: string; autorId: string; motivo: string };
export interface ReportarContenidoPort { ejecutar(input: ReportarContenidoInput): Promise<Reporte>; }
