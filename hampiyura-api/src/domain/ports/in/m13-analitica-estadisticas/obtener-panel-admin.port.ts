import { EstadoReporte } from '../../../value-objects/estado-reporte.vo';

// FASE 3: básico (RF-32). FASE 7: se amplía el MISMO panel con RF-186/187/188/189 -- no se
// duplica el endpoint. RF-190 (exportar PDF/Excel, Could) no se implementó, ver resumen de la sesión.
export interface ResumenReportes { pendientes: number; revisados: number; desestimados: number; }
// Lo que ve cada rol se decide EN EL SERVIDOR: un especialista recibe solo su trabajo (validaciones de su área,
// reportes, consultas); las cifras de usuarios, pagos, planes y comisión solo se calculan y envían al Administrador.
export interface ResumenConsultas { pendientes: number; enProceso: number; resueltas: number; }
export interface PanelEspecialista {
  alcance: 'especialista';
  validacionesPendientes: number;
  reportes: ResumenReportes;
  consultas: ResumenConsultas;
}
export interface PanelCompleto {
  alcance: 'completo';
  validacionesPendientes: number;
  usuariosRegistrados: number;
  usuariosActivos: number;
  plantasPublicadas: number;
  publicacionesRealizadas: number;
  reportes: ResumenReportes;
  consultas: ResumenConsultas;
  // M-15: pagos por Yape/Plin que esperan confirmación, y accesos vigentes ahora mismo.
  pagos: { pendientesDeConfirmar: number; confirmados: number; rechazados: number };
  accesos: { planesActivos: number; desbloqueosVigentes: number };
  // M-11: la plataforma todavía NO registra ventas, así que no existe una comisión acumulada que calcular.
  // Se muestra lo que sí es real: cuántos productores aceptaron el 5% y cuántos productos hay publicados.
  comision: { porcentaje: number; productoresQueAceptaron: number; productosPublicados: number; ventasRegistradas: false; montoAcumulado: null };
}
export type PanelAdmin = PanelCompleto | PanelEspecialista;
export interface ObtenerPanelAdminPort { ejecutar(rol: string): Promise<PanelAdmin>; }
