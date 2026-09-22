import { apiRequest } from '../../../shared/api/client';

export interface PanelAdmin {
  validacionesPendientes: number;
  usuariosRegistrados: number;
  plantasPublicadas: number;
}

export function obtenerPanel(): Promise<PanelAdmin> { return apiRequest<PanelAdmin>('/admin/panel'); }
