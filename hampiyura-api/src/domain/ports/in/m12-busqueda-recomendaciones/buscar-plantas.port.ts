// RF-17 (nombre) / RF-18+RF-42 (enfermedad, también sirve como "recomendación por enfermedad") /
// RF-110+RF-153+RF-19 (propiedad medicinal = categoría = catálogo Uso de M-04, RF-256) en un único
// endpoint combinable, en vez de 7 endpoints separados (ver decisión en el resumen de la fase).
export interface FiltrosBusquedaPlantas {
  q?: string;
  enfermedad?: string;
  // "propiedad" (RF-110) y "categoria" (RF-148/153/19) son el MISMO eje semántico en este sistema
  // (el catálogo Uso) -- se aceptan ambos nombres de parámetro, cualquiera de los dos filtra igual.
  propiedad?: string;
  categoria?: string;
}

// RF-20: cada resultado trae imagen + nombre + breve descripción para el listado/cuadrícula.
// `descripcionBreve` sale de la publicación VALIDADA más reciente de esa planta (M-06) si existe
// -- nunca se inventa una descripción; si no hay ninguna publicación aprobada, viaja en null.
export interface ResultadoBusquedaPlanta {
  id: string;
  nombreComun: string;
  nombreCientifico: string;
  imagenPrincipal?: string;
  descripcionBreve: string | null;
}

export interface BuscarPlantasPort { ejecutar(filtros: FiltrosBusquedaPlantas): Promise<ResultadoBusquedaPlanta[]>; }
