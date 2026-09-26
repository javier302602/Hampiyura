import { apiRequest } from '../../../shared/api/client';

// M-15 · Contacto pagado y planes. Mismos contratos que el backend (planes.use-cases.ts).
export interface DefinicionPlan {
  id: 'Explorador' | 'DesbloqueoPuntual' | 'Negocio' | 'Empresarial' | 'Institucional' | 'Productor';
  nombre: string;
  paraQuien: string;
  incluye: string[];
  proximamente: string[];
  precio: number;
  precioTexto: string;
  periodicidad: 'gratis' | 'unica-vez' | 'mensual';
  referencial: true;
}
export interface DatosDeCobro { yape: { numero: string; titular: string } | null; plin: { numero: string; titular: string } | null; }
export interface CatalogoPlanes {
  planes: DefinicionPlan[];
  cobro: DatosDeCobro;
  fondoConservacion: { porcentaje: number; acumuladoSoles: number; esContador: true };
}
export type EstadoPago = 'Pendiente' | 'Confirmado' | 'Rechazado' | 'Vencido';
export interface PagoVisible {
  id: string; usuarioId: string; usuarioNombre: string; usuarioCorreo: string;
  concepto: 'Plan' | 'Desbloqueo'; plan?: string; productorId?: string; productorNombre?: string; conceptoTexto: string;
  monto: number; metodo: string; numeroOperacion?: string; comprobanteUrl: string;
  estado: EstadoPago; creadoEn: string; revisadoEn?: string; revisadoPorNombre?: string; motivoRechazo?: string; vigenteDesde?: string; vigenteHasta?: string;
}
export interface MiPlan {
  plan: 'Explorador' | 'Negocio' | 'Empresarial' | 'Institucional';
  vencimiento?: string;
  estadoPago: EstadoPago | null;
  desbloqueos: { productorId: string; productorNombre: string; vigenteHasta: string }[];
  pagos: PagoVisible[];
}
export interface ProductorContactable {
  id: string; nombre: string; nombreNegocio?: string; region: string; biografia?: string; plantas: string[]; zonas: string[]; certificado: boolean; zonasProducto: string[]; cantidadMaxima?: number; cercania?: 'zona' | 'departamento';
}
export interface FichaProductor extends ProductorContactable {
  contactoDisponible: boolean;
  contacto: { telefono?: string; contactosDeProductos: string[] } | null;
  desbloqueoHasta?: string;
}

export function obtenerCatalogoPlanes(): Promise<CatalogoPlanes> { return apiRequest<CatalogoPlanes>('/planes'); }
export function obtenerMiPlan(): Promise<MiPlan> { return apiRequest<MiPlan>('/planes/mi-plan'); }

export interface SolicitarPagoInput {
  concepto: 'Plan' | 'Desbloqueo';
  plan?: string;
  productorId?: string;
  metodo: 'Yape' | 'Plin';
  numeroOperacion?: string;
  comprobanteUrl: string;
}
// El monto no se envía: lo fija el servidor según el plan.
export function solicitarPago(input: SolicitarPagoInput): Promise<PagoVisible> {
  return apiRequest<PagoVisible>('/planes/pagos', { method: 'POST', body: JSON.stringify(input) });
}

export type FiltroPagos = 'Pendiente' | 'Confirmado' | 'Rechazado' | 'PlanesVigentes' | 'DesbloqueosVigentes';
export function listarPagos(estado?: FiltroPagos): Promise<PagoVisible[]> {
  return apiRequest<PagoVisible[]>(estado ? `/planes/pagos?estado=${estado}` : '/planes/pagos');
}
export function obtenerDetallePago(id: string): Promise<PagoVisible> { return apiRequest<PagoVisible>(`/planes/pagos/${encodeURIComponent(id)}`); }
export function confirmarPago(id: string): Promise<void> { return apiRequest<void>(`/planes/pagos/${encodeURIComponent(id)}/confirmar`, { method: 'POST' }); }
export function rechazarPago(id: string, motivo: string): Promise<void> {
  return apiRequest<void>(`/planes/pagos/${encodeURIComponent(id)}/rechazar`, { method: 'POST', body: JSON.stringify({ motivo }) });
}

// Filtros avanzados (plan Empresarial o Institucional): el servidor los rechaza para quien no tenga ese plan.
export interface FiltrosDirectorio { certificado?: boolean; cantidadMinima?: number; cerca?: string }
export function listarProductores(f: FiltrosDirectorio = {}): Promise<ProductorContactable[]> {
  const q = new URLSearchParams();
  if (f.certificado) q.set('certificado', '1');
  if (f.cantidadMinima !== undefined) q.set('cantidadMinima', String(f.cantidadMinima));
  if (f.cerca) q.set('cerca', f.cerca);
  const s = q.toString();
  return apiRequest<ProductorContactable[]>(`/productores${s ? `?${s}` : ''}`);
}
export function obtenerProductor(id: string): Promise<FichaProductor> { return apiRequest<FichaProductor>(`/productores/${encodeURIComponent(id)}`); }

export const RUTAS_M15 = {
  planes: '/m15-planes',
  pagar: '/m15-planes/pagar',
  miPlan: '/m15-planes/mi-plan',
  pagosAdmin: '/m15-planes/pagos',
  productores: '/m15-planes/productores',
} as const;
