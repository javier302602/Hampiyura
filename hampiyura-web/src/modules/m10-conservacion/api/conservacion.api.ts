import { apiRequest } from '../../../shared/api/client';

export const NIVELES_RIESGO_CONSERVACION = ['PreocupacionMenor', 'CasiAmenazada', 'Vulnerable', 'EnPeligro', 'EnPeligroCritico', 'NoEvaluada'] as const;
export type NivelRiesgoConservacion = (typeof NIVELES_RIESGO_CONSERVACION)[number];

export const ESTADOS_SEGUIMIENTO_ACCION = ['Planificada', 'EnCurso', 'Completada', 'Suspendida'] as const;
export type EstadoSeguimientoAccion = (typeof ESTADOS_SEGUIMIENTO_ACCION)[number];

// Texto literal exacto de RF-267 cuando no hay ningún estado de conservación validado -- lo
// devuelve el propio backend (TEXTO_CONSERVACION_NO_DETERMINADO), nunca se resume ni se omite.
export interface EstadoConservacionProps {
  id: string;
  plantaId: string;
  autorId: string;
  categoria: string;
  zona: string;
  amenazas: string;
  nivelRiesgo: NivelRiesgoConservacion;
  disponibilidadTemporada: string;
  recomendacionesConservacion: string;
  metodosPropagacion: string;
  alternativasCultivo: string;
  fuenteOficial: { valor: string };
  fecha: string;
  estadoValidacion: string;
}

// Forma real de GET /plantas/:plantaId/conservacion (y del campo `conservacion` embebido en
// GET /plantas/:id, M-02) -- RF-269: `alertaVisible` decide si se muestra la alerta prominente.
export type EstadoConservacionVisible =
  | ({ disponible: true; alertaVisible: boolean } & EstadoConservacionProps)
  | { disponible: false; mensaje: string; alertaVisible: false };

export function obtenerEstadoConservacion(plantaId: string): Promise<EstadoConservacionVisible> {
  return apiRequest<EstadoConservacionVisible>(`/plantas/${plantaId}/conservacion`);
}

export interface RegistrarEstadoConservacionInput {
  categoria: string;
  zona: string;
  amenazas: string;
  nivelRiesgo: string;
  disponibilidadTemporada: string;
  recomendacionesConservacion: string;
  metodosPropagacion: string;
  alternativasCultivo: string;
  fuenteOficial: string;
}
export function registrarEstadoConservacion(plantaId: string, input: RegistrarEstadoConservacionInput): Promise<EstadoConservacionProps> {
  return apiRequest<EstadoConservacionProps>(`/plantas/${plantaId}/conservacion`, { method: 'POST', body: JSON.stringify(input) });
}

// RF-268: registro de actividad vinculado directamente a la Planta (no al EstadoConservacion) --
// no exige fuente y se publica de inmediato, sin pasar por M-09 (a diferencia del estado).
export interface AccionConservacion {
  id: string;
  plantaId: string;
  autorId: string;
  descripcion: string;
  responsable: string;
  evidencias: string;
  estadoSeguimiento: EstadoSeguimientoAccion;
  fecha: string;
}
export interface RegistrarAccionConservacionInput {
  descripcion: string;
  responsable: string;
  evidencias: string;
  estadoSeguimiento: string;
}
export function registrarAccionConservacion(plantaId: string, input: RegistrarAccionConservacionInput): Promise<AccionConservacion> {
  return apiRequest<AccionConservacion>(`/plantas/${plantaId}/acciones-conservacion`, { method: 'POST', body: JSON.stringify(input) });
}
export function listarAccionesConservacion(plantaId: string): Promise<AccionConservacion[]> {
  return apiRequest<AccionConservacion[]>(`/plantas/${plantaId}/acciones-conservacion`);
}
