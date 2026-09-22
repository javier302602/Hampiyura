export const ROLES = ['Visitante','UsuarioRegistrado','PortadorConocimiento','EspecialistaAgronomo','EspecialistaConservacion','EspecialistaSalud','Productor','Administrador'] as const;
export type Rol = typeof ROLES[number];
export function esRol(value: string): value is Rol { return (ROLES as readonly string[]).includes(value); }
