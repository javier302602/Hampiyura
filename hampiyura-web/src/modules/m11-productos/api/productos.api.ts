import { apiRequest } from '../../../shared/api/client';

// Forma cruda de la respuesta de POST /productos (producto.props en el controller) -- también la
// que devuelven PATCH .../validar-documental y .../certificar (no pasan por la vista enriquecida).
// Frente 3: entrada estructurada de "planta utilizada" -- reemplaza los checkboxes de una lista
// fija. plantaId queda vacío si el texto libre no matcheó ninguna planta del catálogo.
export interface PlantaUtilizada {
  plantaId?: string;
  plantaNombreLibre: string;
  parteUsada: string;
  estado: string;
  cantidad?: string;
}

export interface Producto {
  id: string;
  productorId: string;
  nombre: string;
  descripcion?: string;
  plantasIds: string[];
  plantasUtilizadas?: PlantaUtilizada[];
  ingredientes?: string;
  presentacion?: string;
  cantidad?: string;
  precioReferencial?: string;
  fotografias: string[];
  localidad: string;
  informacionProceso: string;
  fechaElaboracion?: string;
  contactoVendedor: string;
  documentacionCertificacion?: string;
  requiereRevisionReforzada: boolean;
  etiquetaValidadoDocumental: boolean;
  etiquetaCertificado: boolean;
  estadoValidacion: string;
}

// Forma de GET /productos y GET /productos/:id (ProductoVisible): solo productos ya Validados
// (aprobados por M-09) -- las 3 etiquetas (revisadoPorEquipo/etiquetaValidadoDocumental/
// etiquetaCertificado) son independientes entre sí (RF-272), y plantasNombres/productorNombre
// vienen resueltos por el backend (ver obtener-producto.port.ts) en vez de UUIDs crudos.
export type ProductoVisible = Producto & { revisadoPorEquipo: boolean; plantasNombres: string[]; productorNombre: string };

export interface PublicarProductoInput {
  nombre: string;
  descripcion?: string;
  plantasUtilizadas: PlantaUtilizada[];
  ingredientes?: string;
  presentacion?: string;
  cantidad?: string;
  precioReferencial?: string;
  fotografias: string[];
  localidad: string;
  informacionProceso: string;
  fechaElaboracion?: string;
  contactoVendedor: string;
  // Solo hace falta enviarlo en true la primera vez que el usuario publica (el backend lo exige
  // solo si Usuario.aceptoComisionEn todavía es null) -- ver PublicarProductoUseCase.
  aceptaComision?: boolean;
}
export function publicarProducto(input: PublicarProductoInput): Promise<Producto> {
  return apiRequest<Producto>('/productos', { method: 'POST', body: JSON.stringify(input) });
}

export interface FiltrosProductos { localidad?: string; plantaId?: string; }
export function listarProductos(filtros: FiltrosProductos = {}): Promise<ProductoVisible[]> {
  const params = new URLSearchParams();
  if (filtros.localidad) params.set('localidad', filtros.localidad);
  if (filtros.plantaId) params.set('plantaId', filtros.plantaId);
  const query = params.toString();
  return apiRequest<ProductoVisible[]>(`/productos${query ? `?${query}` : ''}`);
}

export function obtenerProducto(id: string): Promise<ProductoVisible> { return apiRequest<ProductoVisible>(`/productos/${id}`); }

export function marcarValidadoDocumentalmente(id: string): Promise<Producto> {
  return apiRequest<Producto>(`/productos/${id}/validar-documental`, { method: 'PATCH' });
}
export function marcarCertificado(id: string, documentacion: string): Promise<Producto> {
  return apiRequest<Producto>(`/productos/${id}/certificar`, { method: 'PATCH', body: JSON.stringify({ documentacion }) });
}

// RF-274: reusa exactamente la misma detección que el backend aplica al publicar (no duplica la
// lista de términos/heurística en el cliente) -- permite avisar ANTES de enviar el formulario.
export function verificarAfirmaciones(input: { nombre?: string; descripcion?: string; informacionProceso?: string; ingredientes?: string }): Promise<{ requiereRevisionReforzada: boolean }> {
  return apiRequest('/productos/verificar-afirmaciones', { method: 'POST', body: JSON.stringify(input) });
}

export { subirMedia, leerArchivoComoBase64 } from '../../m06-publicaciones/api/publicaciones.api';
