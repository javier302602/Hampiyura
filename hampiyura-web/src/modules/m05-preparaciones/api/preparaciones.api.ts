import { apiRequest } from '../../../shared/api/client';

// RF-259: este aviso es incondicional y fijo (Preparacion.avisoLegal() en el backend, constante
// AVISO_CULTURAL_TRADICIONAL) -- se replica aquí literal para poder mostrarlo también en la
// confirmación justo tras documentar (estado Pendiente), momento en el que la respuesta del POST
// todavía no trae este campo (solo lo agrega la vista GET, ver PreparacionVisible más abajo).
export const AVISO_CULTURAL_TRADICIONAL = 'Esta preparación documenta conocimiento cultural/tradicional; no constituye una indicación médica ni sustituye la consulta con un profesional de salud.';

// Forma cruda de la respuesta de POST /preparaciones (preparacion.props en el controller).
export interface Preparacion {
  id: string;
  parteUsoId: string;
  autorId: string;
  ingredientes: string;
  pasos: string;
  herramientas: string;
  tiempoPreparacion: string;
  formaTradicionalElaboracion: string;
  formaConservacion: string;
  advertencias: string;
  contraindicaciones?: string;
  fuente: { valor: string };
  localidad: string;
  fecha: string;
  estadoValidacion: string;
}

// Forma de GET /preparaciones/:id y GET /partes-uso/:parteUsoId/preparaciones (PreparacionVisible):
// solo incluye preparaciones ya Validadas (RF-261) -- una recién documentada (Pendiente) no aparece
// aquí hasta que un especialista la apruebe.
export type PreparacionVisible = Preparacion & { avisoLegal: string };

export interface DocumentarPreparacionInput {
  parteUsoId: string;
  ingredientes: string;
  pasos: string;
  herramientas: string;
  tiempoPreparacion: string;
  formaTradicionalElaboracion: string;
  formaConservacion: string;
  advertencias: string;
  contraindicaciones?: string;
  fuente: string;
  localidad: string;
}
export function documentarPreparacion(input: DocumentarPreparacionInput): Promise<Preparacion> {
  return apiRequest<Preparacion>('/preparaciones', { method: 'POST', body: JSON.stringify(input) });
}

export function listarPreparacionesPorParteUso(parteUsoId: string): Promise<PreparacionVisible[]> {
  return apiRequest<PreparacionVisible[]>(`/partes-uso/${parteUsoId}/preparaciones`);
}
