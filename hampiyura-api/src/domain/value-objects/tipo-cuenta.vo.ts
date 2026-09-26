// Tipo de cuenta que una persona puede SOLICITAR desde su perfil (lo aprueba un administrador; nunca se aplica solo).
// No son roles nuevos: "Productor" sí es un rol del sistema; "Empresario" e "Institución de investigación" se guardan como
// Usuario.tipoCuenta sin cambiar el rol (no existen como roles de permisos).
// Ronda 20: el tipo de cuenta NO tiene relación con los planes de pago (M-15): cambiar de tipo es gratis para los tres y no
// activa ni exige ningún plan. Los planes son solo sobre el acceso al contacto de los productores, como comprador.
export const TIPOS_CUENTA_SOLICITABLES = ['Productor', 'Empresario', 'Institucion'] as const;
export type TipoCuenta = typeof TIPOS_CUENTA_SOLICITABLES[number];
export function esTipoCuenta(v: string): v is TipoCuenta { return (TIPOS_CUENTA_SOLICITABLES as readonly string[]).includes(v); }

export const ETIQUETA_TIPO_CUENTA: Record<TipoCuenta, string> = { Productor: 'Productor', Empresario: 'Empresario', Institucion: 'Institución de investigación' };
// Cuentas "normales" que pueden pedir el cambio (el equipo y quien ya tiene un tipo no lo piden).
export const ROLES_QUE_PUEDEN_SOLICITAR = ['UsuarioRegistrado', 'PortadorConocimiento'] as const;
