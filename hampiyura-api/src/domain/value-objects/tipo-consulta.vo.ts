// RF-263: los 7 tipos vienen literales del SDS, no se agrega ni quita ninguno.
export const TIPOS_CONSULTA = [
  'PreguntaGeneral',
  'ReporteInformacionIncorrecta',
  'SolicitudRevisionPublicacion',
  'SolicitudValidacionInformacion',
  'ReportePlantaEnPeligro',
  'ReporteProblemaCultivo',
  'ConsultaSobrePublicacion',
] as const;
export type TipoConsulta = typeof TIPOS_CONSULTA[number];
export function esTipoConsulta(value: string): value is TipoConsulta { return (TIPOS_CONSULTA as readonly string[]).includes(value); }
