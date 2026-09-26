import { apiRequest } from '../../../shared/api/client';

// Contrato de GET /admin/panel. El servidor decide qué manda según el rol: el Administrador recibe el panel completo
// y un especialista solo su trabajo (validaciones de su área, reportes, consultas) -- las cifras de pagos, planes,
// comisión y usuarios nunca llegan al navegador de un especialista.
export interface ResumenReportes { pendientes: number; revisados: number; desestimados: number }
export interface ResumenConsultas { pendientes: number; enProceso: number; resueltas: number }
export interface PanelEspecialista { alcance: 'especialista'; validacionesPendientes: number; reportes: ResumenReportes; consultas: ResumenConsultas }
export interface PanelCompleto {
  alcance: 'completo';
  validacionesPendientes: number;
  usuariosRegistrados: number;
  usuariosActivos: number;
  plantasPublicadas: number;
  publicacionesRealizadas: number;
  reportes: ResumenReportes;
  consultas: ResumenConsultas;
  pagos: { pendientesDeConfirmar: number; confirmados: number; rechazados: number };
  accesos: { planesActivos: number; desbloqueosVigentes: number };
  comision: { porcentaje: number; productoresQueAceptaron: number; productosPublicados: number; ventasRegistradas: false; montoAcumulado: null };
}
export type PanelAdmin = PanelCompleto | PanelEspecialista;

export function obtenerPanel(): Promise<PanelAdmin> { return apiRequest<PanelAdmin>('/admin/panel'); }

// Gestión de usuarios (RF nuevo, este frente): listar/suspender/reactivar ya existían en el
// backend sin ningún consumidor en el frontend; cambiarRolUsuario es la pieza nueva. Todo detrás
// de requireAdmin en el servidor -- esta pantalla también está gateada a Administrador (ver
// App.tsx), así que "solo un Administrador puede asignar el rol Administrador" queda cubierto por
// quién puede llegar hasta acá, sin necesitar una regla aparte.
export const ROLES_USUARIO = ['Visitante', 'UsuarioRegistrado', 'PortadorConocimiento', 'EspecialistaAgronomo', 'EspecialistaConservacion', 'EspecialistaSalud', 'Productor', 'Administrador'] as const;
export type RolUsuario = (typeof ROLES_USUARIO)[number];
export interface UsuarioAdmin { id: string; nombre: string; correo: string; rol: RolUsuario; estado: 'PendienteActivacion' | 'Activo' | 'Suspendido'; }

export function listarUsuarios(): Promise<UsuarioAdmin[]> { return apiRequest<UsuarioAdmin[]>('/admin/usuarios'); }
export function suspenderUsuario(id: string): Promise<{ id: string; estado: string }> {
  return apiRequest(`/admin/usuarios/${encodeURIComponent(id)}/suspender`, { method: 'PATCH' });
}
export function reactivarUsuario(id: string): Promise<{ id: string; estado: string }> {
  return apiRequest(`/admin/usuarios/${encodeURIComponent(id)}/reactivar`, { method: 'PATCH' });
}
export function cambiarRolUsuario(id: string, rol: RolUsuario): Promise<{ id: string; rol: string }> {
  return apiRequest(`/admin/usuarios/${encodeURIComponent(id)}/rol`, { method: 'PATCH', body: JSON.stringify({ rol }) });
}
