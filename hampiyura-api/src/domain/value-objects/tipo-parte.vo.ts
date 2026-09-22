export const TIPOS_PARTE = ['Hoja', 'Fruto', 'Raíz', 'Corteza', 'Tallo', 'Flor', 'Semilla', 'Otra'] as const;
export type TipoParte = typeof TIPOS_PARTE[number];
export function esTipoParte(value: string): value is TipoParte { return (TIPOS_PARTE as readonly string[]).includes(value); }
