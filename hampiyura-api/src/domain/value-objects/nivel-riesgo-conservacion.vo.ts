// Categorías estilo UICN (taxonomía estándar de conservación, no una afirmación sobre ninguna
// planta real en particular). "En riesgo" para RF-269 = las 3 últimas.
export const NIVELES_RIESGO_CONSERVACION = ['PreocupacionMenor', 'CasiAmenazada', 'Vulnerable', 'EnPeligro', 'EnPeligroCritico', 'NoEvaluada'] as const;
export type NivelRiesgoConservacion = typeof NIVELES_RIESGO_CONSERVACION[number];
export function esNivelRiesgoConservacion(value: string): value is NivelRiesgoConservacion { return (NIVELES_RIESGO_CONSERVACION as readonly string[]).includes(value); }

const NIVELES_EN_RIESGO: readonly NivelRiesgoConservacion[] = ['Vulnerable', 'EnPeligro', 'EnPeligroCritico'];
export function esNivelEnRiesgo(nivel: NivelRiesgoConservacion): boolean { return NIVELES_EN_RIESGO.includes(nivel); }
