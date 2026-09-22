import { PublicacionVisible } from './obtener-publicacion.port';
// Solo publicaciones con estadoValidacion='Validado' -- una publicación PENDIENTE
// simplemente no aparece en este listado público (criterio de aceptación de esta fase).
export interface ListarPublicacionesPort { ejecutar(): Promise<PublicacionVisible[]>; }
