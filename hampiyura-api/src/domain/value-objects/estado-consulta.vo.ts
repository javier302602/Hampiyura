// RF-266: Pendiente -> EnRevision -> Respondida -> Cerrada, y Cerrada puede reabrirse a Pendiente.
export const ESTADOS_CONSULTA = ['Pendiente', 'EnRevision', 'Respondida', 'Cerrada'] as const;
export type EstadoConsulta = typeof ESTADOS_CONSULTA[number];
export function esEstadoConsulta(value: string): value is EstadoConsulta { return (ESTADOS_CONSULTA as readonly string[]).includes(value); }
