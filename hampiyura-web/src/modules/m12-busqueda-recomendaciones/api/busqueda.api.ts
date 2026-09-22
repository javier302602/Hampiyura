import { apiRequest } from '../../../shared/api/client';

// "propiedad" (RF-110) y "categoria" (RF-148/153/19) son el MISMO eje semántico en el backend (el
// catálogo Uso de M-04) -- el backend acepta ambos nombres de parámetro indistintamente. Aquí se
// usa un único campo `categoria` en el frontend (decisión de UI, no se duplica la etiqueta).
export interface FiltrosBusqueda {
  q?: string;
  enfermedad?: string;
  categoria?: string;
}

// Forma real de GET /buscar (ResultadoBusquedaPlanta en el backend): descripcionBreve sale de la
// publicación validada más reciente de esa planta (o null si no hay ninguna) -- nunca se inventa.
export interface ResultadoBusquedaPlanta {
  id: string;
  nombreComun: string;
  nombreCientifico: string;
  imagenPrincipal?: string;
  descripcionBreve: string | null;
}

export function buscarPlantas(filtros: FiltrosBusqueda): Promise<ResultadoBusquedaPlanta[]> {
  const params = new URLSearchParams();
  if (filtros.q?.trim()) params.set('q', filtros.q.trim());
  if (filtros.enfermedad?.trim()) params.set('enfermedad', filtros.enfermedad.trim());
  if (filtros.categoria?.trim()) params.set('categoria', filtros.categoria.trim());
  const query = params.toString();
  return apiRequest<ResultadoBusquedaPlanta[]>(`/buscar${query ? `?${query}` : ''}`);
}

// Ningún filtro activo -- útil para que la barra de búsqueda decida si ya hay una búsqueda en curso.
export function filtrosVacios(filtros: FiltrosBusqueda): boolean {
  return !filtros.q?.trim() && !filtros.enfermedad?.trim() && !filtros.categoria?.trim();
}
