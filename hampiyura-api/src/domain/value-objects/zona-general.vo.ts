// Zona general de un producto ("localidad"): se ELIGE de esta lista fija, no se escribe. Granularidad = provincia y departamento
// (nunca distrito exacto, dirección ni coordenadas). Es pública y gratis para todos (la "ubicación general por zona" del plan
// Explorador); el punto exacto de dónde se fabrica sigue detrás del plan/desbloqueo (latitud/longitud).
//
// Cobertura: provincias de la Amazonía peruana y de la ceja de selva donde se cultivan y elaboran productos con plantas
// amazónicas, más "Otra zona" para lo que quede fuera. Ampliar la lista es agregar una línea.
export const ZONA_NO_ESPECIFICADA = 'No especificado';
export const OTRA_ZONA = 'Otra zona (fuera de la lista)';

const POR_DEPARTAMENTO: Record<string, string[]> = {
  Amazonas: ['Bagua', 'Bongará', 'Chachapoyas', 'Condorcanqui', 'Luya', 'Rodríguez de Mendoza', 'Utcubamba'],
  Cajamarca: ['Jaén', 'San Ignacio'],
  Cusco: ['La Convención', 'Paucartambo'],
  Huánuco: ['Ambo', 'Huánuco', 'Leoncio Prado', 'Pachitea', 'Puerto Inca', 'Yarowilca'],
  Junín: ['Chanchamayo', 'Satipo'],
  Loreto: ['Alto Amazonas', 'Datem del Marañón', 'Loreto', 'Mariscal Ramón Castilla', 'Maynas', 'Putumayo', 'Requena', 'Ucayali'],
  'Madre de Dios': ['Manu', 'Tahuamanu', 'Tambopata'],
  Pasco: ['Oxapampa', 'Pasco'],
  Puno: ['Carabaya', 'Sandia'],
  'San Martín': ['Bellavista', 'El Dorado', 'Huallaga', 'Lamas', 'Mariscal Cáceres', 'Moyobamba', 'Picota', 'Rioja', 'San Martín', 'Tocache'],
  Ucayali: ['Atalaya', 'Coronel Portillo', 'Padre Abad', 'Purús'],
};

export const ZONAS_GENERALES: string[] = [
  ...Object.entries(POR_DEPARTAMENTO).flatMap(([dep, provincias]) => provincias.map((p) => `${p}, ${dep}`)),
  OTRA_ZONA,
];
export function esZonaGeneral(v: string | undefined | null): v is string { return !!v && ZONAS_GENERALES.includes(v); }
