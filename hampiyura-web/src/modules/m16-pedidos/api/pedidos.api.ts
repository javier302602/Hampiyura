import { apiRequest } from '../../../shared/api/client';

// M-16 · Compra directa (Yape/Plin/cuenta) con contrato de compraventa. HampiYura no custodia dinero: solo
// registra el contrato, el comprobante y la línea de tiempo, y media en los reclamos.

export interface EstadoCompra { comprable: boolean; motivo?: string; esDemostracion: boolean; medios: string[]; entregaDias?: number; precioUnitario?: number }
export function obtenerEstadoCompra(productoId: string): Promise<EstadoCompra> { return apiRequest(`/productos/${encodeURIComponent(productoId)}/estado-compra`); }

export interface CobroProducto { yape?: string; plin?: string; cuenta?: string; entregaDias: number }
export function obtenerMiCobro(productoId: string): Promise<CobroProducto | null> { return apiRequest(`/productos/${encodeURIComponent(productoId)}/cobro`); }
export interface ConfigurarCobroInput { yape?: string; plin?: string; cuenta?: string; entregaDias: number; aceptaCompromiso: boolean }
export function configurarCobro(productoId: string, input: ConfigurarCobroInput): Promise<void> {
  return apiRequest(`/productos/${encodeURIComponent(productoId)}/cobro`, { method: 'PUT', body: JSON.stringify(input) });
}

export interface EntregaInput { nombre: string; telefono: string; direccion: string }
export interface VistaPreviaPedido { contrato: string; total: number; precioUnitario: number; cantidad: number; entregaDias: number; medios: string[]; comisionReferencial: number }
export function vistaPreviaPedido(productoId: string, cantidad: number, entrega?: EntregaInput): Promise<VistaPreviaPedido> {
  return apiRequest('/pedidos/vista-previa', { method: 'POST', body: JSON.stringify({ productoId, cantidad, entrega }) });
}
export function crearPedido(input: { productoId: string; cantidad: number; entrega: EntregaInput; aceptaContrato: boolean }): Promise<{ id: string }> {
  return apiRequest('/pedidos', { method: 'POST', body: JSON.stringify(input) });
}

export type EstadoPedido = 'PendientePago' | 'PagoInformado' | 'PagoRechazado' | 'PagoConfirmado' | 'Enviado' | 'Recibido' | 'Reclamo' | 'Cerrado' | 'Cancelado';
export const ETIQUETA_ESTADO_PEDIDO: Record<EstadoPedido, string> = {
  PendientePago: 'Pendiente de pago', PagoInformado: 'Pago informado, por confirmar', PagoRechazado: 'Pago rechazado', PagoConfirmado: 'Pago confirmado, por enviar',
  Enviado: 'Enviado', Recibido: 'Recibido', Reclamo: 'En reclamo', Cerrado: 'Reclamo cerrado', Cancelado: 'Cancelado',
};
export interface PedidoResumen { id: string; productoNombre: string; cantidad: number; total: number; estado: EstadoPedido; creadoEn: string; fechaLimiteEntrega?: string; con: string; plazoVencido: boolean }
export function misPedidos(rol: 'comprador' | 'vendedor'): Promise<PedidoResumen[]> { return apiRequest(`/pedidos?rol=${rol}`); }

export interface EventoPedido { estado: EstadoPedido; fecha: string; actorId: string; nota?: string }
export interface PedidoDetalle {
  id: string; productoId: string; productoNombre: string; compradorId: string; vendedorId: string; compradorNombre?: string; vendedorNombre?: string;
  cantidad: number; precioUnitario: number; total: number; comisionReferencial: number;
  entregaNombre: string; entregaTelefono: string; entregaDireccion: string;
  cobro?: CobroProducto; metodoElegido?: string; comprobanteUrl?: string; numeroOperacion?: string;
  estado: EstadoPedido; entregaDias: number; fechaLimiteEntrega?: string; plazoVencido: boolean;
  contratoVersion: string; contratoTexto: string; compradorAceptoEn: string; vendedorCompromisoEn: string;
  notaEnvio?: string; motivoRechazoPago?: string; motivoReclamo?: string; resolucion?: string;
  eventos: EventoPedido[]; creadoEn: string; actualizadoEn: string;
  rolDelSolicitante: 'comprador' | 'vendedor' | 'administrador'; acciones: string[];
}
export function obtenerPedido(id: string): Promise<PedidoDetalle> { return apiRequest(`/pedidos/${encodeURIComponent(id)}`); }
export function informarPago(id: string, metodo: string, comprobanteUrl: string, numeroOperacion?: string): Promise<void> {
  return apiRequest(`/pedidos/${encodeURIComponent(id)}/pago`, { method: 'POST', body: JSON.stringify({ metodo, comprobanteUrl, numeroOperacion }) });
}
export function confirmarPagoPedido(id: string): Promise<void> { return apiRequest(`/pedidos/${encodeURIComponent(id)}/confirmar-pago`, { method: 'POST' }); }
export function rechazarPagoPedido(id: string, motivo: string): Promise<void> { return apiRequest(`/pedidos/${encodeURIComponent(id)}/rechazar-pago`, { method: 'POST', body: JSON.stringify({ motivo }) }); }
export function marcarEnviado(id: string, nota: string): Promise<void> { return apiRequest(`/pedidos/${encodeURIComponent(id)}/enviado`, { method: 'POST', body: JSON.stringify({ nota }) }); }
export function confirmarRecepcion(id: string): Promise<void> { return apiRequest(`/pedidos/${encodeURIComponent(id)}/recibido`, { method: 'POST' }); }
export function abrirReclamo(id: string, motivo: string): Promise<void> { return apiRequest(`/pedidos/${encodeURIComponent(id)}/reclamo`, { method: 'POST', body: JSON.stringify({ motivo }) }); }
export function resolverReclamo(id: string, resolucion: string): Promise<void> { return apiRequest(`/pedidos/${encodeURIComponent(id)}/resolver`, { method: 'POST', body: JSON.stringify({ resolucion }) }); }
export function cancelarPedido(id: string): Promise<void> { return apiRequest(`/pedidos/${encodeURIComponent(id)}/cancelar`, { method: 'POST' }); }
export interface ReclamoResumen { id: string; productoNombre: string; total: number; motivoReclamo?: string; creadoEn: string }
export function reclamosPendientes(): Promise<ReclamoResumen[]> { return apiRequest('/pedidos/reclamos'); }

export const RUTAS_PEDIDOS = { comprar: (productoId: string) => `/m16-pedidos/comprar/${productoId}`, detalle: (id: string) => `/m16-pedidos/${id}`, mios: '/m16-pedidos', reclamos: '/m16-pedidos/reclamos' } as const;
