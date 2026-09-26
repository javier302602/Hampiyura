import { apiRequest } from '../../../shared/api/client';
import type { ProductorContactable } from './planes.api';

// Ronda 30 · M-15: mensajería directa y alertas (plan Negocio), reportes (plan Institucional) y "Productores disponibles" (complemento Premium).
// Mismos contratos que el backend (application/m15-planes/*.use-cases.ts).

// --- Mensajería directa ---
export interface ConversacionResumen {
  id: string; conTipo: 'productor' | 'comprador'; conId: string; conNombre: string;
  ultimoMensaje?: { texto: string; creadoEn: string; propio: boolean }; sinLeer: number; actualizadaEn: string;
}
export interface MensajeVisible { id: string; texto: string; creadoEn: string; propio: boolean; leido: boolean }
export interface ConversacionDetalle { id: string; conNombre: string; conTipo: 'productor' | 'comprador'; puedeResponder: boolean; motivoBloqueo?: string; mensajes: MensajeVisible[] }
export const listarConversaciones = () => apiRequest<ConversacionResumen[]>('/mensajes/conversaciones');
export const obtenerConversacion = (id: string) => apiRequest<ConversacionDetalle>(`/mensajes/conversaciones/${encodeURIComponent(id)}`);
export const escribirAProductor = (productorId: string, texto: string) => apiRequest<{ conversacionId: string }>('/mensajes', { method: 'POST', body: JSON.stringify({ productorId, texto }) });
export const responderConversacion = (id: string, texto: string) => apiRequest<{ ok: true }>(`/mensajes/conversaciones/${encodeURIComponent(id)}`, { method: 'POST', body: JSON.stringify({ texto }) });
export const MAX_CARACTERES_MENSAJE = 1000;

// --- Alertas de disponibilidad y temporada ---
export interface AlertaVisible {
  plantaId: string; plantaNombre: string; disponibilidad: boolean; temporada: boolean;
  productosDisponiblesAhora: number; enTemporadaAhora: boolean; mesesCosecha: number[]; creadoEn: string;
}
export const listarAlertas = () => apiRequest<AlertaVisible[]>('/alertas');
export const seguirPlanta = (plantaId: string, opciones: { disponibilidad?: boolean; temporada?: boolean } = {}) => apiRequest<AlertaVisible[]>('/alertas', { method: 'POST', body: JSON.stringify({ plantaId, ...opciones }) });
export const dejarDeSeguirPlanta = (plantaId: string) => apiRequest<void>(`/alertas/${encodeURIComponent(plantaId)}`, { method: 'DELETE' });

// --- Reportes agregados (Institucional) ---
export interface FilaConteo { etiqueta: string; cantidad: number | null; oculto: boolean }
export interface ReporteBioeconomia {
  generadoEn: string; umbralMinimo: number; diasBusquedas: number;
  totales: { productoresActivos: number; productoresContactables: number; plantasEnCatalogo: number; plantasConFichaDeCultivoValidada: number; fichasDeCultivoValidadas: number; productosPublicados: number };
  productoresPorZona: FilaConteo[]; productosPorCategoria: FilaConteo[]; productosPorTipoProductor: FilaConteo[]; plantasMasOfrecidas: FilaConteo[]; plantasMasBuscadas: FilaConteo[];
  notas: string[];
}
export const obtenerReporteBioeconomia = () => apiRequest<ReporteBioeconomia>('/reportes/bioeconomia');

// --- Productores disponibles (Premium) ---
export interface ProductorDisponible extends ProductorContactable { tiposProductor: string[]; disponibleHasta: string; nota?: string }
export interface ListadoDisponibles { productores: ProductorDisponible[]; opciones: { plantas: string[]; zonas: string[]; tipos: string[] } }
export interface AccesoDisponibles { permitido: boolean; motivo?: string }
export interface MiDisponibilidad { disponible: boolean; disponibleHasta?: string; nota?: string; contactable: boolean }
export const accesoProductoresDisponibles = () => apiRequest<AccesoDisponibles>('/productores-disponibles/acceso');
export function listarProductoresDisponibles(f: { planta?: string; zona?: string; tipo?: string } = {}) {
  const q = new URLSearchParams();
  if (f.planta) q.set('planta', f.planta); if (f.zona) q.set('zona', f.zona); if (f.tipo) q.set('tipo', f.tipo);
  return apiRequest<ListadoDisponibles>(`/productores-disponibles${q.toString() ? `?${q}` : ''}`);
}
export const obtenerMiDisponibilidad = () => apiRequest<MiDisponibilidad>('/productores-disponibles/mi-estado');
export const marcarMiDisponibilidad = (disponible: boolean, nota?: string) => apiRequest<{ disponibleHasta: string | null }>('/productores-disponibles/mi-estado', { method: 'PUT', body: JSON.stringify({ disponible, nota }) });

export const RUTAS_EXTRAS = {
  mensajes: '/m15-planes/mensajes',
  alertas: '/m15-planes/alertas',
  reportes: '/m15-planes/reportes',
  disponibles: '/m15-planes/productores-disponibles',
} as const;
