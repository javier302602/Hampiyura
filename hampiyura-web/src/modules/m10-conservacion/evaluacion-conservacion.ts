// Ronda 31 · Estado de conservación de referencia (IUCN + D.S. N° 043-2006-AG). Espejo de la lógica del backend
// (domain/value-objects/evaluacion-conservacion.vo.ts, con sus tests): mismo criterio de "en riesgo".
export type CategoriaIucn = 'NE' | 'DD' | 'LC' | 'NT' | 'VU' | 'EN' | 'CR';
export const ETIQUETA_CATEGORIA: Record<CategoriaIucn, string> = {
  NE: 'No evaluada', DD: 'Datos Insuficientes', LC: 'Preocupación Menor', NT: 'Casi Amenazado', VU: 'Vulnerable', EN: 'En Peligro', CR: 'Peligro Crítico',
};
const EN_RIESGO: CategoriaIucn[] = ['VU', 'EN', 'CR'];

export interface CategoriaConFuente { categoria: CategoriaIucn; anio?: string; fuente: string; aclaracion?: string; soloSilvestre?: boolean }
export interface CategoriaPeru { categoria: CategoriaIucn | 'NF'; fuente: string; norma: string; anio?: string; aclaracion?: string }
export interface EvaluacionConservacion {
  iucn?: CategoriaConFuente; peru?: CategoriaPeru;
  pendiente?: string;         // contradicción sin resolver: no se muestra ninguna categoría
  avisoIdentidad?: string;
  aclaracionInicio?: string;
}

// Categoría de riesgo confirmada (la más alta entre IUCN y Perú) o null. Con `pendiente`, o con una categoría que es solo de poblaciones silvestres, no cuenta.
export function categoriaDeRiesgo(e?: EvaluacionConservacion | null): CategoriaIucn | null {
  if (!e || e.pendiente) return null;
  const c = [e.iucn?.soloSilvestre ? undefined : e.iucn?.categoria, e.peru?.categoria].filter((x): x is CategoriaIucn => !!x && EN_RIESGO.includes(x as CategoriaIucn));
  return c.length ? c.sort((a, b) => EN_RIESGO.indexOf(b) - EN_RIESGO.indexOf(a))[0] : null;
}
// La sección "Plantas en riesgo" del inicio se arma sola con los datos: vacío = no se muestra.
export function plantasEnRiesgo<T extends { evaluacionConservacion?: EvaluacionConservacion | null }>(plantas: T[]): T[] {
  return plantas.filter((p) => categoriaDeRiesgo(p.evaluacionConservacion) !== null);
}

// Etiqueta de las tarjetas: SOLO con VU/EN/CR confirmado; nunca en No evaluada, Datos Insuficientes, Café (solo poblaciones silvestres) ni en Ojé sin confirmar.
export function etiquetaDeRiesgo(p: { evaluacionConservacion?: EvaluacionConservacion | null }): string | undefined {
  const c = categoriaDeRiesgo(p.evaluacionConservacion);
  return c ? ETIQUETA_CATEGORIA[c] : undefined;
}
