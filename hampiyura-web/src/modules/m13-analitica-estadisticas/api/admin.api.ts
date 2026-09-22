import { apiRequest } from '../../../shared/api/client';

export interface PanelAdmin {
  validacionesPendientes: number;
  usuariosRegistrados: number;
  plantasPublicadas: number;
}

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
