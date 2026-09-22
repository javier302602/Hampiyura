export const ESTADOS_REPORTE = ['Pendiente', 'Revisado', 'Desestimado'] as const;
export type EstadoReporte = typeof ESTADOS_REPORTE[number];
export function esEstadoReporte(value: string): value is EstadoReporte { return (ESTADOS_REPORTE as readonly string[]).includes(value); }
