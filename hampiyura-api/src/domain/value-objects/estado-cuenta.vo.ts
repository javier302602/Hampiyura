export const ESTADOS_CUENTA = ['PendienteActivacion', 'Activo', 'Suspendido'] as const;
export type EstadoCuenta = typeof ESTADOS_CUENTA[number];
