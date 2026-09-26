import { apiRequest } from '../../../shared/api/client';

// Mismos valores que TIPOS_PARTE / TIPOS_CONOCIMIENTO en el backend
// (src/domain/value-objects/tipo-parte.vo.ts y tipo-conocimiento.vo.ts).
export const TIPOS_PARTE = ['Hoja', 'Fruto', 'Raíz', 'Corteza', 'Tallo', 'Flor', 'Semilla', 'Otra'] as const;
export const TIPOS_CONOCIMIENTO = ['Tradicional', 'Documentado', 'Científico', 'Pendiente'] as const;
export type TipoConocimiento = (typeof TIPOS_CONOCIMIENTO)[number];

export interface Uso {
  id: string;
  nombre: string;
  descripcion?: string;
}

// Forma real de la respuesta de GET /plantas/:id/partes-uso y GET /partes-uso/:id
// (ParteUsoVisible en el backend): incluye siempre verificado/advertencia (RF-257).
export interface ParteUso {
  id: string;
  plantaId: string;
  autorId: string;
  parte: string;
  usoId: string;
  tipoConocimiento: TipoConocimiento;
  preparacionId?: string;
  contraindicaciones?: string;
  fuente: { valor: string };
  estadoValidacion: string;
  verificado: boolean;
  advertencia: string | null;
}

export function listarUsos(): Promise<Uso[]> { return apiRequest<Uso[]>('/usos'); }
export function registrarUso(input: { nombre: string; descripcion?: string }): Promise<Uso> {
  return apiRequest<Uso>('/usos', { method: 'POST', body: JSON.stringify(input) });
}

export function listarPartesUsoPorPlanta(plantaId: string): Promise<ParteUso[]> {
  return apiRequest<ParteUso[]>(`/plantas/${plantaId}/partes-uso`);
}

export interface RegistrarParteUsoInput {
  plantaId: string;
  parte: string;
  usoId: string;
  tipoConocimiento: string;
  fuente: string;
  contraindicaciones?: string;
}
export function registrarParteUso(input: RegistrarParteUsoInput): Promise<{ id: string }> {
  return apiRequest<{ id: string }>('/partes-uso', { method: 'POST', body: JSON.stringify(input) });
}

// --- Seguimiento científico (solo Especialista en salud / Administrador) ---
// Usos de conocimiento TRADICIONAL ya aprobados, y el camino para validarlos científicamente con evidencia real.
export interface ItemSeguimiento {
  id: string; etiqueta: string; autorNombre: string; tipoConocimiento: string; tieneContactoSeguimiento: boolean; validadaCientificamente: boolean;
}
export interface DetalleSeguimiento {
  id: string; etiqueta: string; autorNombre: string; estadoValidacion: string; tipoConocimiento: string;
  campos: { etiqueta: string; valor: string }[];
  contactoSeguimiento: string | null;
  puedeRegistrarValidacionCientifica: boolean;
  validacionCientifica: { especialista: string; fecha: string; evidencia: string; enlace?: string; registradaEn: string; registradaPorNombre: string } | null;
}
export function listarSeguimiento(): Promise<ItemSeguimiento[]> { return apiRequest<ItemSeguimiento[]>('/partes-uso/seguimiento'); }
export function obtenerSeguimiento(id: string): Promise<DetalleSeguimiento> { return apiRequest<DetalleSeguimiento>(`/partes-uso/seguimiento/${encodeURIComponent(id)}`); }
export function guardarContactoSeguimiento(id: string, contacto: string): Promise<void> {
  return apiRequest<void>(`/partes-uso/seguimiento/${encodeURIComponent(id)}/contacto`, { method: 'PATCH', body: JSON.stringify({ contacto: contacto.trim() || null }) });
}
export interface ValidacionCientificaInput { especialista: string; fecha: string; evidencia: string; enlace?: string; }
export function registrarValidacionCientifica(id: string, input: ValidacionCientificaInput): Promise<void> {
  return apiRequest<void>(`/partes-uso/seguimiento/${encodeURIComponent(id)}/validacion-cientifica`, { method: 'POST', body: JSON.stringify(input) });
}
