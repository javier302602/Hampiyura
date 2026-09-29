import { apiRequest } from '../../../shared/api/client';

// M-17 · Compra directa de cosecha, ligada a una ficha de cultivo (no a un producto publicado de M-11). Es una
// operación distinta de M-16: aquí el comprador PROPONE cantidad+monto sobre un cultivo ya declarado, el
// agricultor acepta o rechaza (sin contraoferta), paga un adelanto del 50% y HampiYura tampoco custodia el dinero.
export type EstadoContratoCultivo = 'Propuesto' | 'Rechazado' | 'AdelantoPendiente' | 'EnCurso' | 'Completado' | 'Cancelado';
export const ETIQUETA_ESTADO_CONTRATO_CULTIVO: Record<EstadoContratoCultivo, string> = {
  Propuesto: 'Propuesto, esperando al agricultor', Rechazado: 'Rechazado', AdelantoPendiente: 'Adelanto pendiente',
  EnCurso: 'En curso (adelanto confirmado)', Completado: 'Completado', Cancelado: 'Cancelado',
};
export type MetodoCobroCultivo = 'Yape' | 'Plin' | 'Cuenta';

export interface ProponerContratoInput { cultivoId: string; cantidad: string; montoAcordado: number; mensaje?: string }
export function proponerContratoCultivo(input: ProponerContratoInput): Promise<{ id: string }> {
  return apiRequest('/contratos-cultivo', { method: 'POST', body: JSON.stringify(input) });
}

export interface ContratoCultivoResumen { id: string; plantaNombre: string; cantidad: string; montoAcordado: number; estado: EstadoContratoCultivo; creadoEn: string; con: string }
export function misContratosCultivo(rol: 'comprador' | 'agricultor'): Promise<ContratoCultivoResumen[]> {
  return apiRequest(`/contratos-cultivo?rol=${rol}`);
}

export interface EventoContratoCultivo { estado: EstadoContratoCultivo; fecha: string; actorId: string; nota?: string }
export interface ContratoCultivoDetalle {
  id: string; cultivoId: string; plantaId: string; plantaNombre: string; agricultorId: string; compradorId: string;
  compradorNombre?: string; agricultorNombre?: string;
  cantidad: string; montoAcordado: number; montoAdelanto: number; montoSaldo: number; comisionReferencial: number; netoAgricultor: number;
  mensajeComprador?: string; cobroMedio?: MetodoCobroCultivo; cobroNumero?: string;
  comprobanteAdelantoUrl?: string; numeroOperacionAdelanto?: string; motivoRechazo?: string; motivoRechazoAdelanto?: string;
  estado: EstadoContratoCultivo; eventos: EventoContratoCultivo[]; creadoEn: string; actualizadoEn: string;
  rolDelSolicitante: 'comprador' | 'agricultor' | 'administrador'; acciones: string[];
}
export function obtenerContratoCultivo(id: string): Promise<ContratoCultivoDetalle> { return apiRequest(`/contratos-cultivo/${encodeURIComponent(id)}`); }
export function aceptarContratoCultivo(id: string, medio: MetodoCobroCultivo, numero: string): Promise<void> {
  return apiRequest(`/contratos-cultivo/${encodeURIComponent(id)}/aceptar`, { method: 'POST', body: JSON.stringify({ medio, numero }) });
}
export function rechazarContratoCultivo(id: string, motivo: string): Promise<void> {
  return apiRequest(`/contratos-cultivo/${encodeURIComponent(id)}/rechazar`, { method: 'POST', body: JSON.stringify({ motivo }) });
}
export function informarAdelantoContratoCultivo(id: string, comprobanteUrl: string, numeroOperacion?: string): Promise<void> {
  return apiRequest(`/contratos-cultivo/${encodeURIComponent(id)}/adelanto`, { method: 'POST', body: JSON.stringify({ comprobanteUrl, numeroOperacion }) });
}
export function confirmarAdelantoContratoCultivo(id: string): Promise<void> { return apiRequest(`/contratos-cultivo/${encodeURIComponent(id)}/confirmar-adelanto`, { method: 'POST' }); }
export function rechazarAdelantoContratoCultivo(id: string, motivo: string): Promise<void> {
  return apiRequest(`/contratos-cultivo/${encodeURIComponent(id)}/rechazar-adelanto`, { method: 'POST', body: JSON.stringify({ motivo }) });
}
export function marcarCompletadoContratoCultivo(id: string): Promise<void> { return apiRequest(`/contratos-cultivo/${encodeURIComponent(id)}/completar`, { method: 'POST' }); }
export function cancelarContratoCultivo(id: string): Promise<void> { return apiRequest(`/contratos-cultivo/${encodeURIComponent(id)}/cancelar`, { method: 'POST' }); }

export const RUTAS_CONTRATOS_CULTIVO = { mios: '/m17-compra-cultivo', detalle: (id: string) => `/m17-compra-cultivo/${id}` } as const;
