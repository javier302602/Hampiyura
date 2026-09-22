import { EstadoValidacion } from '../../value-objects/estado-validacion.vo';

// Cualquier repositorio de una entidad que pasa por el flujo de validación de M-09
// (Cultivo, ParteUso, ...) implementa esto para que aprobar/observar/rechazar puedan
// reflejar el nuevo estado en la entidad de origen, sin que M-09 conozca sus detalles.
export interface EntidadValidableRepositoryPort { actualizarEstadoValidacion(id: string, estado: EstadoValidacion): Promise<void>; }

// tipoEntidad (ValidacionContenido.tipoEntidad) -> repositorio capaz de reflejar el estado.
export type RegistroEntidadesValidables = Partial<Record<string, EntidadValidableRepositoryPort>>;
