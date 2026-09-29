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

// Quién produce: visible y gratis en la ficha. Es una declaración del productor.
export const TIPOS_PRODUCTOR = ['Campesino', 'Empresario', 'Comunidad'] as const;
export type TipoProductor = (typeof TIPOS_PRODUCTOR)[number];
export const ETIQUETAS_TIPO_PRODUCTOR: Record<TipoProductor, string> = { Campesino: 'Campesino', Empresario: 'Empresario', Comunidad: 'Comunidad' };

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
  // Ronda 36 (M-16): stock REAL en unidades, público. undefined/null = el vendedor no lo gestiona (sin límite mostrado).
  stockDisponible?: number | null;
  fotografias: string[];
  localidad: string;
  // Frente 6 (mini-mapa por producto): coordenadas reales del pin soltado en el selector de mapa
  // al publicar -- antes se usaban solo para geocodificación inversa y se descartaban. Opcionales:
  // localidad sigue siendo texto editable a mano, y productos publicados antes de este cambio no
  // las tienen.
  latitud?: number;
  longitud?: number;
  informacionProceso: string;
  fechaElaboracion?: string;
  // Ronda 18. Productos anteriores no tienen tipoProductor; lo demás es opcional y nunca se rellena por el sistema.
  tipoProductor?: TipoProductor;
  categoriasUso?: string[];
  modoDeUso?: string;
  contraindicaciones?: string;
  // M-15: null cuando quien consulta no tiene plan activo ni desbloqueo vigente de este productor.
  contactoVendedor: string | null;
  contactoBloqueado?: boolean;
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
  latitud?: number;
  longitud?: number;
  informacionProceso: string;
  fechaElaboracion?: string;
  tipoProductor: TipoProductor;
  categoriasUso?: string[];
  modoDeUso?: string;
  contraindicaciones?: string;
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

// Zonas generales (provincia y departamento) que acepta el servidor para "localidad": lista fija, la misma que valida al publicar.
export function listarZonasGenerales(): Promise<string[]> { return apiRequest<string[]>('/productos/zonas'); }

export function obtenerProducto(id: string): Promise<ProductoVisible> { return apiRequest<ProductoVisible>(`/productos/${id}`); }

export function marcarValidadoDocumentalmente(id: string): Promise<Producto> {
  return apiRequest<Producto>(`/productos/${id}/validar-documental`, { method: 'PATCH' });
}
export function marcarCertificado(id: string, documentacion: string): Promise<Producto> {
  return apiRequest<Producto>(`/productos/${id}/certificar`, { method: 'PATCH', body: JSON.stringify({ documentacion }) });
}

// RF-274: reusa exactamente la misma detección que el backend aplica al publicar (no duplica la
// lista de términos/heurística en el cliente) -- permite avisar ANTES de enviar el formulario.
export function verificarAfirmaciones(input: { nombre?: string; descripcion?: string; informacionProceso?: string; ingredientes?: string; modoDeUso?: string }): Promise<{ requiereRevisionReforzada: boolean }> {
  return apiRequest('/productos/verificar-afirmaciones', { method: 'POST', body: JSON.stringify(input) });
}

export { subirMedia, leerArchivoComoBase64 } from '../../m06-publicaciones/api/publicaciones.api';
