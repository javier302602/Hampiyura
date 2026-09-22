import { EstadoReporte } from '../../../value-objects/estado-reporte.vo';

// FASE 3: básico (RF-32). FASE 7: se amplía el MISMO panel con RF-186/187/188/189 -- no se
// duplica el endpoint. RF-190 (exportar PDF/Excel, Could) no se implementó, ver resumen de la sesión.
export interface ResumenReportes { pendientes: number; revisados: number; desestimados: number; }
export interface PanelAdmin {
  validacionesPendientes: number;
  usuariosRegistrados: number;
  usuariosActivos: number;
  plantasPublicadas: number;
  publicacionesRealizadas: number;
  reportes: ResumenReportes;
}
export interface ObtenerPanelAdminPort { ejecutar(): Promise<PanelAdmin>; }
