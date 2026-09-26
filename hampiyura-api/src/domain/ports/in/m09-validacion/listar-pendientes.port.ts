import { ValidacionContenido } from '../../../entities/validacion-contenido.entity';
// `etiqueta`: texto legible para la bandeja de validación (ej. nombre de la publicación + autor)
// en vez de mostrar solo tipoEntidad + un UUID. Por defecto (tipos no reconocidos) sigue siendo
// "tipoEntidad · entidadId", igual que antes -- no es un mecanismo nuevo, solo enriquece la misma
// lista para los tipos que ya se pueden resolver con los repositorios existentes.
export type ValidacionPendienteVisible = ValidacionContenido['props'] & { etiqueta: string };
// Con `rol`, solo las pendientes que ESE rol puede decidir (un especialista, las de su área; el administrador, todas). Es el mismo
// criterio (rolPuedeValidarTipo) con el que el panel cuenta "Validaciones pendientes".
export interface ListarPendientesPort { ejecutar(rol?: string): Promise<ValidacionPendienteVisible[]>; }
