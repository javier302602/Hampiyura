import { apiRequest } from '../../../shared/api/client';

// Categorías de motivo (mismos valores que el backend). "Otro" es el único que exige describirlo con texto libre.
export const CATEGORIAS_REPORTE = [
  { valor: 'InformacionFalsa', etiqueta: 'Información falsa o engañosa' },
  { valor: 'ContenidoInapropiado', etiqueta: 'Contenido inapropiado' },
  { valor: 'Spam', etiqueta: 'Spam' },
  { valor: 'SuplantacionSinFuente', etiqueta: 'Suplantación de conocimiento tradicional sin fuente' },
  { valor: 'Otro', etiqueta: 'Otro (descríbelo)' },
] as const;
export type CategoriaReporte = (typeof CATEGORIAS_REPORTE)[number]['valor'];
export const etiquetaCategoriaReporte = (c: string) => (c === 'Otro' ? 'Otro motivo' : CATEGORIAS_REPORTE.find((x) => x.valor === c)?.etiqueta ?? 'Otro motivo');

export type EstadoReporte = 'Pendiente' | 'Revisado' | 'Desestimado';

// `contenido` solo se resuelve para tipoEntidad='Comentario' (lo único que hoy se puede reportar
// desde la interfaz); null si es otro tipo o el contenido ya no existe.
export interface Reporte {
  id: string;
  tipoEntidad: string;
  entidadId: string;
  autorId: string;
  reportadoPor: string;
  categoria: CategoriaReporte;
  motivo: string; // descripción escrita por quien reporta (puede estar vacía si eligió una categoría)
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
