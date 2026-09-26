// Guía de cultivo de un especialista en agronomía (Ronda 22): ficha técnica organizada en secciones. TODOS los campos son opcionales y
// nacen vacíos ("pendiente de un especialista"); el sistema nunca rellena nada. Basada en los apartados habituales de las fichas
// técnicas de extensión agronómica (suelo, nutrición, calendario, espaciamiento, riego, clima, sanidad, cosecha).
// `opciones`: campo de selección cerrada (el valor debe ser una de ellas). Sin `opciones`: texto libre de al menos `minimo` caracteres.
export interface CampoGuia { clave: string; seccion: string; etiqueta: string; minimo: number; opciones?: string[] }
export const SECCION_MARCO_LEGAL = 'Marco legal y manejo responsable';
export const CATEGORIAS_CONSERVACION = ['No evaluada', 'Vulnerable', 'En peligro', 'En peligro crítico', 'Otra'];
export const OPCIONES_AUTORIZACION = ['Sí', 'No', 'No verificado'];
export const CAMPOS_GUIA: CampoGuia[] = [
  { clave: 'suelo', seccion: 'Suelo', etiqueta: 'Tipo o textura', minimo: 10 },
  { clave: 'ph', seccion: 'Suelo', etiqueta: 'Rango de pH ideal', minimo: 3 },
  { clave: 'drenaje', seccion: 'Suelo', etiqueta: 'Drenaje', minimo: 10 },
  { clave: 'nutrientes', seccion: 'Nutrientes', etiqueta: 'Requerimientos principales (N-P-K u otros)', minimo: 10 },
  { clave: 'enmiendas', seccion: 'Nutrientes', etiqueta: 'Enmiendas orgánicas recomendadas', minimo: 10 },
  { clave: 'epocaSiembra', seccion: 'Calendario', etiqueta: 'Época de siembra', minimo: 3 },
  { clave: 'cicloCosecha', seccion: 'Calendario', etiqueta: 'Duración del ciclo hasta la cosecha', minimo: 3 },
  { clave: 'germinacion', seccion: 'Calendario', etiqueta: 'Tiempo estimado de germinación', minimo: 3 },
  { clave: 'espaciamiento', seccion: 'Espaciamiento', etiqueta: 'Distancia entre plantas o densidad de siembra', minimo: 3 },
  { clave: 'riego', seccion: 'Riego', etiqueta: 'Método y frecuencia aproximada', minimo: 10 },
  { clave: 'temperatura', seccion: 'Clima', etiqueta: 'Rango de temperatura', minimo: 3 },
  { clave: 'altitud', seccion: 'Clima', etiqueta: 'Altitud adecuada', minimo: 3 },
  { clave: 'precipitacion', seccion: 'Clima', etiqueta: 'Precipitación adecuada', minimo: 3 },
  { clave: 'plagas', seccion: 'Plagas y enfermedades', etiqueta: 'Problemas comunes y manejo responsable', minimo: 10 },
  { clave: 'herramientas', seccion: 'Herramientas', etiqueta: 'Herramientas necesarias', minimo: 10 },
  { clave: 'indicadoresCosecha', seccion: 'Cosecha', etiqueta: 'Señales de que está lista para cosechar', minimo: 10 },
  // Ronda 25 -- Marco legal y manejo responsable. Todo vacío hasta que un especialista lo complete y cite su fuente: la app NO afirma
  // por especie si hace falta un permiso (eso depende de la categorización oficial vigente y del fin de uso).
  { clave: 'conservacionCategoria', seccion: SECCION_MARCO_LEGAL, etiqueta: 'Categoría de conservación', minimo: 0, opciones: CATEGORIAS_CONSERVACION },
  { clave: 'conservacionFuente', seccion: SECCION_MARCO_LEGAL, etiqueta: 'Fuente de la categoría (norma o listado)', minimo: 5 },
  { clave: 'autorizacionSerfor', seccion: SECCION_MARCO_LEGAL, etiqueta: '¿Requiere autorización de SERFOR u otra entidad para su cosecha o cultivo con fines comerciales?', minimo: 0, opciones: OPCIONES_AUTORIZACION },
  { clave: 'autorizacionDetalle', seccion: SECCION_MARCO_LEGAL, etiqueta: 'Detalle y fuente de la autorización', minimo: 10 },
  { clave: 'conocimientoAncestral', seccion: SECCION_MARCO_LEGAL, etiqueta: 'Reconocimiento de conocimiento ancestral (Ley 27811)', minimo: 10 },
  { clave: 'manejoResponsable', seccion: SECCION_MARCO_LEGAL, etiqueta: 'Notas de manejo responsable', minimo: 10 },
];
export type ClaveGuia = typeof CAMPOS_GUIA[number]['clave'];
export type GuiaCultivoDatos = Partial<Record<string, string>>;
export const MAX_CAMPO_GUIA = 1500;

// Cultivo responsable (RF-252): la guía NO recomienda agroquímicos de uso peligroso o prohibido. Lista corta y conservadora de
// plaguicidas ampliamente restringidos; si aparece alguno, se rechaza el texto para que el especialista proponga manejo
// cultural, biológico u orgánico.
const AGROQUIMICOS_PELIGROSOS = ['paraquat', 'glifosato', 'glyphosate', 'clorpirifos', 'chlorpyrifos', 'carbofuran', 'carbofurano', 'metamidofos', 'endosulfan', 'endosulfán', 'monocrotofos', 'aldicarb', 'ddt', 'lindano', 'paration', 'paratión', '2,4-d'];
export function agroquimicoPeligrosoEn(texto: string): string | undefined {
  const t = texto.toLowerCase();
  return AGROQUIMICOS_PELIGROSOS.find((a) => new RegExp('(^|[^a-záéíóúñ0-9])' + a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[^a-záéíóúñ0-9])').test(t));
}
