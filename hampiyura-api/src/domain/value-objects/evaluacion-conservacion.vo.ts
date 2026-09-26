// Ronda 31 · Estado de conservación de cada planta según DOS fuentes: IUCN Red List (global) y D.S. N° 043-2006-AG (flora amenazada del Perú).
// Fuente de verdad: docs/plantas medicinales/HAMPIYURA_Estado_Conservacion_27_Especies.md. Regla RF-252/RF-257:
//  - una categoría de riesgo solo se muestra si esa fuente la da; "NE" (No evaluada) se muestra literalmente como "No evaluada" (nunca vacío);
//  - si hay una contradicción sin resolver (Ojé), no se publica ninguna categoría: solo el texto `pendiente`.
// Es INDEPENDIENTE del registro comunitario de M-10 (EstadoConservacion): aquel lo cargan especialistas; este es el dato de referencia del equipo.

export const CATEGORIAS_IUCN = ['NE', 'DD', 'LC', 'NT', 'VU', 'EN', 'CR'] as const;
export type CategoriaIucn = typeof CATEGORIAS_IUCN[number];
export const ETIQUETA_CATEGORIA: Record<CategoriaIucn, string> = {
  NE: 'No evaluada', DD: 'Datos Insuficientes', LC: 'Preocupación Menor', NT: 'Casi Amenazado', VU: 'Vulnerable', EN: 'En Peligro', CR: 'Peligro Crítico',
};
// "En riesgo" = Vulnerable, En Peligro o Peligro Crítico (misma definición de RF-269 / M-10).
export const CATEGORIAS_EN_RIESGO: readonly CategoriaIucn[] = ['VU', 'EN', 'CR'];

export interface CategoriaConFuente {
  categoria: CategoriaIucn;
  anio?: string;          // texto: "2019", "2016/2017"; ausente = la fuente de investigación no lo consigna
  fuente: string;
  aclaracion?: string;    // p. ej. Café: la categoría es de las poblaciones silvestres
  // true = la categoría describe SOLO poblaciones silvestres de un lugar (Café: Etiopía/Sudán del Sur), no la planta tal como se cultiva y usa aquí:
  // se muestra con su aclaración, pero NO cuenta como "planta en riesgo" (ni destacada, ni etiqueta, ni RN-07).
  soloSilvestre?: boolean;
}
export interface CategoriaPeru {
  // 'NF' = no figura / no encontrada en la lista peruana (según las búsquedas del equipo; los anexos completos no se leyeron línea por línea)
  categoria: CategoriaIucn | 'NF';
  fuente: string;
  norma: string;
  anio?: string;
  aclaracion?: string;
}
export interface EvaluacionConservacion {
  iucn?: CategoriaConFuente;
  peru?: CategoriaPeru;
  // Contradicción sin resolver entre fuentes: NO se publica ninguna categoría, solo este texto.
  pendiente?: string;
  // Aviso de identidad (especies emparentadas vendidas bajo el mismo nombre popular).
  avisoIdentidad?: string;
  // Aclaración corta que acompaña a la planta en la sección de riesgo del inicio (ya documentada en su ficha de hábitat).
  aclaracionInicio?: string;
}

// Categoría de riesgo confirmada (la más alta entre IUCN y Perú), o null. Con `pendiente` nunca hay categoría.
export function categoriaDeRiesgo(e?: EvaluacionConservacion | null): CategoriaIucn | null {
  if (!e || e.pendiente) return null;
  const orden = CATEGORIAS_EN_RIESGO;
  const candidatas = [e.iucn?.soloSilvestre ? undefined : e.iucn?.categoria, e.peru?.categoria].filter((c): c is CategoriaIucn => !!c && c !== ('NF' as string) && orden.includes(c as CategoriaIucn));
  if (candidatas.length === 0) return null;
  return candidatas.sort((a, b) => orden.indexOf(b) - orden.indexOf(a))[0];
}
export const estaEnRiesgo = (e?: EvaluacionConservacion | null) => categoriaDeRiesgo(e) !== null;

// La sección "Plantas en riesgo" del inicio se arma SOLA a partir de los datos: cualquier planta con VU/EN/CR confirmado. Vacío => no se muestra.
export function plantasEnRiesgo<T extends { evaluacionConservacion?: EvaluacionConservacion | null }>(plantas: T[]): T[] {
  return plantas.filter((p) => estaEnRiesgo(p.evaluacionConservacion));
}
