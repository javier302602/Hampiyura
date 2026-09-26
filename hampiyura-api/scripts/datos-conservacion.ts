// Ronda 31 — Estado de conservación de las 27 plantas. ÚNICA fuente: docs/plantas medicinales/HAMPIYURA_Estado_Conservacion_27_Especies.md
// (IUCN Red List + D.S. N° 043-2006-AG). No se usa conocimiento general: lo que el archivo no da con fuente queda "No evaluada" o sin año.
import { EvaluacionConservacion, CategoriaIucn } from '../src/domain/value-objects/evaluacion-conservacion.vo';

const IUCN = 'IUCN Red List (https://www.iucnredlist.org)';
const DS = 'D.S. N° 043-2006-AG (lista oficial peruana de flora amenazada)';
const NORMA = 'D.S. N° 043-2006-AG';
const iucn = (categoria: CategoriaIucn, anio?: string, aclaracion?: string, soloSilvestre?: boolean) => ({ categoria, anio, fuente: IUCN, aclaracion, ...(soloSilvestre ? { soloSilvestre } : {}) });
const NO_FIGURA = (aclaracion?: string) => ({ categoria: 'NF' as const, fuente: `${DS}: no aparece en la lista según la búsqueda del equipo (los anexos completos del decreto no se leyeron línea por línea)`, norma: NORMA, aclaracion });
const SIN_EVALUAR = (aclaracion?: string) => iucn('NE', undefined, aclaracion);

export const CONSERVACION: Record<string, EvaluacionConservacion> = {
  'Zea mays': { iucn: iucn('LC', '2019'), peru: NO_FIGURA() },
  'Coffea arabica': { iucn: iucn('EN', '2020', 'Esta categoría es de las poblaciones SILVESTRES de Etiopía y Sudán del Sur (su centro de origen), no del café cultivado en el mundo.', true), peru: NO_FIGURA() },
  'Musa spp.': { iucn: iucn('LC', '2016/2017'), peru: NO_FIGURA() },
  'Theobroma cacao': { iucn: iucn('DD', undefined, 'Datos Insuficientes no es lo mismo que "sin riesgo": falta información sobre las poblaciones silvestres amazónicas.'), peru: NO_FIGURA() },
  'Persea americana': { iucn: SIN_EVALUAR('Wikipedia muestra "LC" sin ninguna cita real; no se encontró una ficha verificable.'), peru: NO_FIGURA() },
  'Annona muricata': { iucn: iucn('LC', '2018'), peru: NO_FIGURA() },
  'Bixa orellana': { iucn: iucn('LC', '2019'), peru: NO_FIGURA() },
  'Mentha piperita': { iucn: SIN_EVALUAR(), peru: NO_FIGURA() },
  'Eucalyptus globulus': { iucn: SIN_EVALUAR('No evaluada o no encontrada.'), peru: NO_FIGURA() },
  'Morinda citrifolia': { iucn: iucn('LC', '2024'), peru: NO_FIGURA() },
  'Plantago major': { iucn: iucn('LC', '2016'), peru: NO_FIGURA() },
  'Croton lechleri': {
    iucn: SIN_EVALUAR(),
    peru: NO_FIGURA('Croton lechleri en sí no aparece.'),
    avisoIdentidad: 'Aviso de identidad: Croton lechleri no tiene una evaluación propia. El D.S. N° 043-2006-AG cataloga como Casi Amenazado (NT) a 5 especies emparentadas de Croton que se venden bajo el mismo nombre popular ("sangre de grado" / "sangre de drago"): C. draconoides, C. erythrochilus, C. palanostigma, C. perspeciosus y C. sampatik. Esa categoría NO corresponde a C. lechleri: son especies distintas.',
  },
  'Uncaria tomentosa': { iucn: SIN_EVALUAR(), peru: NO_FIGURA() },
  'Phyllanthus niruri': { iucn: SIN_EVALUAR(), peru: NO_FIGURA() },
  'Maytenus macrocarpa': { iucn: iucn('LC', '2019', 'Registrada también como Monteverdia macrocarpa.'), peru: NO_FIGURA() },
  'Genipa americana': { iucn: iucn('LC', '2021'), peru: NO_FIGURA() },
  'Dracontium loretense': { iucn: SIN_EVALUAR('Registrada también como Dracontium spruceanum.'), peru: NO_FIGURA() },
  'Plukenetia volubilis': { iucn: SIN_EVALUAR(), peru: NO_FIGURA() },
  'Myrciaria dubia': { iucn: iucn('LC', '2019', 'Confirmación indirecta (vía la cita de Wikipedia), no una lectura directa de iucnredlist.org.'), peru: NO_FIGURA() },
  'Petiveria alliacea': { iucn: SIN_EVALUAR('Solo tiene el estatus "Secure" de NatureServe, que no es una categoría de la IUCN.'), peru: NO_FIGURA() },
  'Copaifera spp.': { iucn: SIN_EVALUAR('A pesar de la sobreexplotación documentada por incisión repetida del tronco. Existe una evaluación LC para Copaifera langsdorffii, pero es otra especie y no aplica a esta ficha.'), peru: NO_FIGURA() },
  // Contradicción sin resolver entre fuentes: NO se publica ninguna categoría.
  'Ficus insipida': { pendiente: 'Estado de conservación: pendiente de confirmación directa en iucnredlist.org.' },
  'Piper aduncum': { iucn: SIN_EVALUAR(), peru: NO_FIGURA() },
  'Gentianella alborosea': {
    // Único caso con riesgo confirmado en DOS fuentes. El año de la evaluación IUCN no está consignado en el archivo de investigación.
    iucn: iucn('EN', undefined, 'El archivo de investigación no consigna el año de la evaluación IUCN: confirmarlo en iucnredlist.org.'),
    peru: { categoria: 'CR', fuente: `${DS}, confirmado textualmente en la Ficha Técnica Hercampuri de PromPerú (https://repositorio.promperu.gob.pe/bitstreams/c7058f3d-40b5-4c2e-bf7e-ff969c209165/download)`, norma: NORMA, anio: '2006' },
    aclaracionInicio: 'Especie altoandina, no amazónica de tierras bajas: en Tingo María y la selva se comercializa, pero no se cultiva localmente.',
  },
  'Smallanthus sonchifolius': { iucn: SIN_EVALUAR('Solo existe una evaluación de un congénere distinto (Smallanthus glabratus), que no aplica a esta especie.'), peru: NO_FIGURA() },
  'Ilex guayusa': { iucn: iucn('LC'), peru: NO_FIGURA() },
  'Mansoa alliacea': { iucn: SIN_EVALUAR(), peru: NO_FIGURA() },
};
