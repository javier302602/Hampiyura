// Tipo de cuenta que una persona puede SOLICITAR desde su perfil (lo aprueba un administrador; nunca se aplica solo).
// No son roles nuevos: "Productor" sí es un rol del sistema; "Empresario" e "Institución de investigación" se guardan como
// Usuario.tipoCuenta sin cambiar el rol (no existen como roles de permisos). El plan de M-15 que le corresponde sale del
// catálogo de planes ya construido (plan.vo.ts) -- aprobar el tipo NO le regala el plan: los de pago se contratan aparte.
export const TIPOS_CUENTA_SOLICITABLES = ['Productor', 'Empresario', 'Institucion'] as const;
export type TipoCuenta = typeof TIPOS_CUENTA_SOLICITABLES[number];
export function esTipoCuenta(v: string): v is TipoCuenta { return (TIPOS_CUENTA_SOLICITABLES as readonly string[]).includes(v); }

export const ETIQUETA_TIPO_CUENTA: Record<TipoCuenta, string> = { Productor: 'Productor', Empresario: 'Empresario', Institucion: 'Institución de investigación' };
// Plan (id de CATALOGO_PLANES) que le corresponde a cada tipo.
export const PLAN_POR_TIPO_CUENTA: Record<TipoCuenta, 'Productor' | 'Negocio' | 'Empresarial'> = { Productor: 'Productor', Empresario: 'Negocio', Institucion: 'Empresarial' };
// Cuentas "normales" que pueden pedir el cambio (el equipo y quien ya tiene un tipo no lo piden).
export const ROLES_QUE_PUEDEN_SOLICITAR = ['UsuarioRegistrado', 'PortadorConocimiento'] as const;
