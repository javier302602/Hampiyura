export const ESTADOS_SEGUIMIENTO_ACCION = ['Planificada', 'EnCurso', 'Completada', 'Suspendida'] as const;
export type EstadoSeguimientoAccion = typeof ESTADOS_SEGUIMIENTO_ACCION[number];
export function esEstadoSeguimientoAccion(value: string): value is EstadoSeguimientoAccion { return (ESTADOS_SEGUIMIENTO_ACCION as readonly string[]).includes(value); }
