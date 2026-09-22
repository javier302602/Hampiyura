export const ESTADOS_VALIDACION = ['Pendiente', 'EnRevision', 'Validado', 'Observado', 'Rechazado'] as const;
export type EstadoValidacion = typeof ESTADOS_VALIDACION[number];
export function esEstadoValidacion(value: string): value is EstadoValidacion { return (ESTADOS_VALIDACION as readonly string[]).includes(value); }
