export const TIPOS_CONOCIMIENTO = ['Tradicional','Documentado','Científico','Pendiente'] as const;
export type TipoConocimiento = typeof TIPOS_CONOCIMIENTO[number];
export function esTipoConocimiento(value: string): value is TipoConocimiento { return (TIPOS_CONOCIMIENTO as readonly string[]).includes(value); }
