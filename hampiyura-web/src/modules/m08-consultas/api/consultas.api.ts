import { apiRequest } from '../../../shared/api/client';

// RF-263: los 7 tipos vienen literales del SDS, mismos valores que el backend (tipo-consulta.vo.ts).
export const TIPOS_CONSULTA = [
  'PreguntaGeneral',
  'ReporteInformacionIncorrecta',
  'SolicitudRevisionPublicacion',
  'SolicitudValidacionInformacion',
  'ReportePlantaEnPeligro',
  'ReporteProblemaCultivo',
  'ConsultaSobrePublicacion',
] as const;
export type TipoConsulta = (typeof TIPOS_CONSULTA)[number];

// Etiquetas legibles -- el backend solo maneja los identificadores PascalCase.
export const ETIQUETAS_TIPO_CONSULTA: Record<TipoConsulta, string> = {
  PreguntaGeneral: 'Pregunta general',
  ReporteInformacionIncorrecta: 'Reporte de información incorrecta',
  SolicitudRevisionPublicacion: 'Solicitud de revisión de una publicación',
  SolicitudValidacionInformacion: 'Solicitud de validación de información',
  ReportePlantaEnPeligro: 'Reporte de planta en peligro',
  ReporteProblemaCultivo: 'Reporte de problema de cultivo',
  ConsultaSobrePublicacion: 'Consulta sobre una publicación',
};

export const ESTADOS_CONSULTA = ['Pendiente', 'EnRevision', 'Respondida', 'Cerrada'] as const;
export type EstadoConsulta = (typeof ESTADOS_CONSULTA)[number];

// Lo que se LEE en pantalla: tres estados en español natural. Los identificadores internos "Respondida" y "Cerrada"
// (cierre manual o automático tras 7 días sin actividad) significan lo mismo para quien lee: la consulta ya está resuelta.
export const ETIQUETAS_ESTADO_CONSULTA: Record<EstadoConsulta, string> = {
  Pendiente: 'Consulta pendiente',
  EnRevision: 'Consulta en proceso',
  Respondida: 'Consulta resuelta',
  Cerrada: 'Consulta resuelta',
};
export const OPCIONES_FILTRO_ESTADO = [
  { valor: 'Pendiente', etiqueta: 'Consulta pendiente' },
  { valor: 'EnRevision', etiqueta: 'Consulta en proceso' },
  { valor: 'Resuelta', etiqueta: 'Consulta resuelta' },
] as const;
export const esResuelta = (estado: EstadoConsulta) => estado === 'Respondida' || estado === 'Cerrada';

export const AREAS_ESPECIALIDAD = ['Agronomia', 'PlantasMedicinales', 'Conservacion', 'Salud'] as const;
export type AreaEspecialidad = (typeof AREAS_ESPECIALIDAD)[number];

// Forma real de la respuesta del backend (Consulta.props) -- prioridad/areaAsignada NUNCA se
// envían al crear, los calcula el servidor (RN-06 y enrutamiento por tipo).
export interface Consulta {
  id: string;
  autorId?: string;
  tipo: TipoConsulta;
  descripcion: string;
  estado: EstadoConsulta;
  prioridad: 'Normal' | 'Alta';
  areaAsignada?: AreaEspecialidad;
  asignadoA?: string;
  fechaCreacion: string;
  fechaActualizacion: string;
  fechaPrimeraRespuestaEquipo?: string;
  // Fotos y ubicación opcionales (gratis, no dependen de ningún plan).
  imagenes?: string[];
  latitud?: number | null;
  longitud?: number | null;
}

export interface MensajeConsulta {
  id: string;
  consultaId: string;
  autorId: string;
  contenido: string;
  esEquipo: boolean;
  fecha: string;
}

export interface ConsultaConHilo extends Consulta { mensajes: MensajeConsulta[]; }

export interface CrearConsultaInput { tipo: TipoConsulta; descripcion: string; imagenes?: string[]; latitud?: number; longitud?: number; }
export function crearConsulta(input: CrearConsultaInput): Promise<Consulta> {
  return apiRequest<Consulta>('/consultas', { method: 'POST', body: JSON.stringify(input) });
}

export interface FiltrosBandejaConsultas { tipo?: TipoConsulta; estado?: EstadoConsulta; area?: AreaEspecialidad; }
export function listarBandejaConsultas(filtros: FiltrosBandejaConsultas = {}): Promise<Consulta[]> {
  const params = new URLSearchParams();
  if (filtros.tipo) params.set('tipo', filtros.tipo);
  if (filtros.estado) params.set('estado', filtros.estado);
  if (filtros.area) params.set('area', filtros.area);
  const query = params.toString();
  return apiRequest<Consulta[]>(`/consultas${query ? `?${query}` : ''}`);
}

export function listarMisConsultas(): Promise<Consulta[]> { return apiRequest<Consulta[]>('/consultas/mias'); }

export function obtenerConsulta(id: string): Promise<ConsultaConHilo> { return apiRequest<ConsultaConHilo>(`/consultas/${id}`); }

export function agregarMensajeConsulta(id: string, contenido: string): Promise<MensajeConsulta> {
  return apiRequest<MensajeConsulta>(`/consultas/${id}/mensajes`, { method: 'POST', body: JSON.stringify({ contenido }) });
}

export function marcarConsultaEnProceso(id: string): Promise<Consulta> {
  return apiRequest<Consulta>(`/consultas/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ accion: 'en_proceso' }) });
}
export function marcarConsultaResuelta(id: string): Promise<Consulta> {
  return apiRequest<Consulta>(`/consultas/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ accion: 'resolver' }) });
}
export function cerrarConsulta(id: string): Promise<Consulta> {
  return apiRequest<Consulta>(`/consultas/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ accion: 'cerrar' }) });
}
export function reabrirConsulta(id: string): Promise<Consulta> {
  return apiRequest<Consulta>(`/consultas/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ accion: 'reabrir' }) });
}
