// M-15 · Contacto pagado y planes. Fuente única de los planes y sus PRECIOS DE REFERENCIA.
// Origen: HAMPIYURA_Mapa_Modelo_Negocio.docx, cap. 4 ("Planes propuestos"): "Los precios son una primera
// hipótesis de trabajo, no una decisión cerrada" -- pendientes de validar con un especialista en negocios y
// productores reales. Por eso el catálogo lo marca `referencial: true` y la interfaz lo dice explícitamente.
//
// El monto que se cobra SIEMPRE sale de aquí (servidor): el cliente nunca manda el monto.
//
// Ronda 20: los planes son SOLO sobre el acceso al contacto de los productores, como comprador. Son independientes del tipo de
// cuenta (Productor, Empresario, Institución de investigación): cambiar de tipo es gratis y no activa ni exige ningún plan, y
// cualquier usuario puede contratar cualquier plan. Publicar productos solo tiene la comisión del 5% (CG-004).

export const PLANES = ['Explorador', 'Negocio', 'Institucional', 'Productor', 'Destacado'] as const;
export type Plan = typeof PLANES[number];
// Planes que se pagan (y por eso tienen vencimiento). Explorador y Productor son gratuitos.
export const PLANES_DE_PAGO = ['Negocio', 'Institucional', 'Destacado'] as const;
export type PlanDePago = typeof PLANES_DE_PAGO[number];
export function esPlanDePago(v: string): v is PlanDePago { return (PLANES_DE_PAGO as readonly string[]).includes(v); }

export const METODOS_PAGO = ['Yape', 'Plin'] as const;
export type MetodoPago = typeof METODOS_PAGO[number];
export function esMetodoPago(v: string): v is MetodoPago { return (METODOS_PAGO as readonly string[]).includes(v); }

export const CONCEPTOS_PAGO = ['Plan', 'Desbloqueo'] as const;
export type ConceptoPago = typeof CONCEPTOS_PAGO[number];

// Suscripciones mensuales y desbloqueo puntual: misma vigencia (30 días desde la confirmación).
export const DIAS_VIGENCIA = 30;
// Hipótesis: el documento habla de "un porcentaje" de los ingresos de Negocio/Institucional/Destacado para un
// fondo de conservación, sin cifra. Solo se usa para un CONTADOR VISIBLE; no mueve dinero real (FASE posterior).
export const PORCENTAJE_FONDO_CONSERVACION = 10;

export interface DefinicionPlan {
  id: Plan | 'DesbloqueoPuntual';
  nombre: string;
  paraQuien: string;
  incluye: string[];
  // Solo lo que hoy EXISTE en la plataforma va en `incluye`; lo que aún no está construido va en `proximamente`.
  proximamente: string[];
  precio: number;             // soles; 0 = gratis
  precioTexto: string;        // cómo se muestra ("S/ 29 al mes")
  periodicidad: 'gratis' | 'unica-vez' | 'mensual';
  referencial: true;
}

export const CATALOGO_PLANES: DefinicionPlan[] = [
  {
    id: 'Explorador', nombre: 'Explorador', paraQuien: 'Público general, estudiantes, investigadores, comunidades',
    incluye: ['Catálogo completo de plantas y sus usos', 'Ubicación general por zona (sin contacto)', 'Búsqueda y filtros básicos', 'Comunidad: publicaciones, comentarios y valoraciones', 'Consultas al equipo con fotos y ubicación'],
    proximamente: [], precio: 0, precioTexto: 'Gratis', periodicidad: 'gratis', referencial: true,
  },
  {
    id: 'DesbloqueoPuntual', nombre: 'Desbloqueo puntual', paraQuien: 'Quien necesita el contacto de un productor concreto, sin suscribirse',
    incluye: ['Contacto de UN productor específico, por 30 días', 'Sobre una ficha que ya viste gratis'],
    proximamente: [], precio: 4, precioTexto: 'S/ 4 por contacto', periodicidad: 'unica-vez', referencial: true,
  },
  {
    id: 'Negocio', nombre: 'Negocio', paraQuien: 'Quien necesita contactar a varios productores para comprarles: negocios, emprendedores, herbolarios. No hace falta para vender ni para ser Empresario',
    incluye: ['Todo lo del plan Explorador', 'Contactos ilimitados de productores'],
    proximamente: ['Mensajería directa en la plataforma', 'Alertas de disponibilidad y temporada', 'Filtros avanzados (cantidad, certificación, cercanía)'],
    precio: 29, precioTexto: 'S/ 29 al mes', periodicidad: 'mensual', referencial: true,
  },
  {
    id: 'Institucional', nombre: 'Institucional', paraQuien: 'Institutos, universidades, ONG y entidades públicas: lo paga un solo administrador en nombre de la institución',
    incluye: ['Todo lo del plan Negocio'],
    proximamente: ['Soporte prioritario', 'Reportes y datos agregados de la bioeconomía regional (sin datos personales de productores)'],
    precio: 120, precioTexto: 'S/ 120 al mes', periodicidad: 'mensual', referencial: true,
  },
  {
    id: 'Productor', nombre: 'Productor', paraQuien: 'Agricultores, comunidades, portadores de conocimiento',
    incluye: ['Publicar cultivos, preparaciones y productos gratis', 'Ficha básica visible en el mapa', 'Aparecer en el directorio de contacto una vez validada tu ficha de cultivo'],
    proximamente: [], precio: 0, precioTexto: 'Gratis', periodicidad: 'gratis', referencial: true,
  },
  {
    id: 'Destacado', nombre: 'Productor Destacado', paraQuien: 'Productores que quieren más visibilidad (opcional)',
    incluye: ['Todo lo del plan Productor', 'Aparecer primero en el directorio, con la etiqueta "Destacado"'],
    proximamente: ['Estadísticas de interés recibido'],
    precio: 15, precioTexto: 'S/ 15 al mes', periodicidad: 'mensual', referencial: true,
  },
];

export function precioDe(id: 'DesbloqueoPuntual' | PlanDePago): number {
  const d = CATALOGO_PLANES.find((p) => p.id === id);
  if (!d) throw new Error(`Plan sin precio definido: ${id}`);
  return d.precio;
}
