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
