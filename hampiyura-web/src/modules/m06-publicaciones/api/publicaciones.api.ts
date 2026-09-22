import { apiRequest } from '../../../shared/api/client';
import { TIPOS_CONOCIMIENTO, type TipoConocimiento } from '../../m04-usos-partes/api/partes-uso.api';

export { TIPOS_CONOCIMIENTO };
export type { TipoConocimiento };

// Forma real de la respuesta de GET /publicaciones y GET /publicaciones/:id (PublicacionVisible en
// el backend): incluye siempre verificado/advertencia (mismo principio de RF-257 que en M-04),
// promedio/total de valoraciones, autorNombre y -- solo si hay sesión -- miValoracion.
export interface Publicacion {
  id: string;
  plantaId: string;
  autorId: string;
  nombreComun: string;
  descripcion: string;
  enfermedadesTratadas: string;
  formaPreparacion: string;
  imagenes: string[];
  tipoConocimiento: TipoConocimiento;
  fuente: { valor: string };
  fechaPublicacion: string;
  estadoValidacion: string;
  verificado: boolean;
  advertencia: string | null;
  promedioEstrellas: number | null;
  totalValoraciones: number;
  autorNombre: string;
  miValoracion: number | null;
  totalComentarios: number;
}

export function listarPublicaciones(): Promise<Publicacion[]> { return apiRequest<Publicacion[]>('/publicaciones'); }
export function obtenerPublicacion(id: string): Promise<Publicacion> { return apiRequest<Publicacion>(`/publicaciones/${id}`); }

export interface CrearPublicacionInput {
  plantaId: string;
  nombreComun: string;
  descripcion: string;
  enfermedadesTratadas: string;
  formaPreparacion: string;
  imagenes: string[];
  tipoConocimiento: string;
  fuente: string;
}

// crearPublicacion/editarPublicacion devuelven las props "crudas" de la entidad (res.json(publicacion.props)
// en el controller), NO la vista enriquecida de GET /publicaciones -- no tienen verificado/advertencia/
// autorNombre/etc. Tipo aparte para no mentir sobre qué campos vienen realmente en la respuesta.
export interface PublicacionCreada {
  id: string;
  plantaId: string;
  autorId: string;
  nombreComun: string;
  descripcion: string;
  enfermedadesTratadas: string;
  formaPreparacion: string;
  imagenes: string[];
  tipoConocimiento: TipoConocimiento;
  fuente: { valor: string };
  fechaPublicacion: string;
  estadoValidacion: string;
}

export function crearPublicacion(input: CrearPublicacionInput): Promise<PublicacionCreada> {
  return apiRequest<PublicacionCreada>('/publicaciones', { method: 'POST', body: JSON.stringify(input) });
}

export type EditarPublicacionInput = Partial<CrearPublicacionInput>;
export function editarPublicacion(id: string, cambios: EditarPublicacionInput): Promise<PublicacionCreada> {
  return apiRequest<PublicacionCreada>(`/publicaciones/${id}`, { method: 'PATCH', body: JSON.stringify(cambios) });
}

export function eliminarPublicacion(id: string): Promise<void> {
  return apiRequest<void>(`/publicaciones/${id}`, { method: 'DELETE' });
}

export function subirMedia(nombreOriginal: string, contenidoBase64: string): Promise<{ url: string }> {
  return apiRequest<{ url: string }>('/publicaciones/media', { method: 'POST', body: JSON.stringify({ nombreOriginal, contenidoBase64 }) });
}

// Convierte un File del input de tipo "file" a base64 para subirMedia (el endpoint espera
// contenidoBase64, no multipart -- ya construido así en el backend desde FASE 4).
export function leerArchivoComoBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(String(lector.result));
    lector.onerror = () => reject(lector.error);
    lector.readAsDataURL(file);
  });
}
