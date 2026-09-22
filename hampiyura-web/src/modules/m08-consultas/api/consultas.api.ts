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

export interface CrearConsultaInput { tipo: TipoConsulta; descripcion: string; }
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

export function cerrarConsulta(id: string): Promise<Consulta> {
  return apiRequest<Consulta>(`/consultas/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ accion: 'cerrar' }) });
}
export function reabrirConsulta(id: string): Promise<Consulta> {
  return apiRequest<Consulta>(`/consultas/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ accion: 'reabrir' }) });
}
