import { apiRequest } from '../../../shared/api/client';

export type EstadoReporte = 'Pendiente' | 'Revisado' | 'Desestimado';

// `contenido` solo se resuelve para tipoEntidad='Comentario' (lo único que hoy se puede reportar
// desde la interfaz); null si es otro tipo o el contenido ya no existe.
export interface Reporte {
  id: string;
  tipoEntidad: string;
  entidadId: string;
  autorId: string;
  reportadoPor: string;
  motivo: string;
  fecha: string;
  estado: EstadoReporte;
  contenido: { texto: string; publicacionId: string; autorNombre: string } | null;
}

export function listarReportes(estado?: EstadoReporte): Promise<Reporte[]> {
  return apiRequest<Reporte[]>(estado ? `/reportes?estado=${estado}` : '/reportes');
}
export function resolverReporte(id: string, estado: 'Revisado' | 'Desestimado'): Promise<Reporte> {
  return apiRequest<Reporte>(`/reportes/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ estado }) });
}
