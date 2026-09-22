// No existía ningún enum de "área de especialista" en el código (RN-05 de M-09 nunca se implementó
// como una restricción real: requireValidator acepta cualquier rol Especialista_* para cualquier
// contenido, sin distinguir área). Este enum es nuevo, propio de M-08 -- no reemplaza ni corrige
// RN-05 en M-09 (fuera de alcance de este módulo; decisión confirmada con el usuario).
export const AREAS_ESPECIALIDAD = ['Agronomia', 'PlantasMedicinales', 'Conservacion', 'Salud'] as const;
export type AreaEspecialidad = typeof AREAS_ESPECIALIDAD[number];
export function esAreaEspecialidad(value: string): value is AreaEspecialidad { return (AREAS_ESPECIALIDAD as readonly string[]).includes(value); }

// Solo 3 de los 8 roles existentes (Rol, rol.vo.ts) mapean a un área real -- no existe un rol
// "EspecialistaPlantasMedicinales" hoy, así que ningún especialista puede reclamar esa área todavía
// (solo Administrador vería esas consultas en la bandeja filtrada). Mapeo acotado a M-08.
const AREA_POR_ROL: Partial<Record<string, AreaEspecialidad>> = {
  EspecialistaAgronomo: 'Agronomia',
  EspecialistaConservacion: 'Conservacion',
  EspecialistaSalud: 'Salud',
};
export function areaDelRol(rol: string): AreaEspecialidad | undefined { return AREA_POR_ROL[rol]; }
