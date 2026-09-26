// Quién produce (visible y gratis en la ficha del producto: le da confianza a quien compra y hace notar la procedencia
// campesina o comunitaria). Es una declaración del productor, no una certificación.
export const TIPOS_PRODUCTOR = ['Campesino', 'Empresario', 'Comunidad'] as const;
export type TipoProductor = typeof TIPOS_PRODUCTOR[number];
export function esTipoProductor(v: string): v is TipoProductor { return (TIPOS_PRODUCTOR as readonly string[]).includes(v); }
