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

export const PLANES = ['Explorador', 'Negocio', 'Empresarial', 'Institucional', 'Productor', 'Premium'] as const;
export type Plan = typeof PLANES[number];
// Planes BASE (escalera de acceso al contacto). Premium NO es un nivel más: es un complemento SOLO para el plan Negocio (Ronda 32:
// Empresarial e Institucional ya incluyen "Productores disponibles" sin costo extra).
export const PLANES_BASE = ['Negocio', 'Empresarial', 'Institucional'] as const;
export type PlanBase = typeof PLANES_BASE[number];
// Planes que se pagan (y por eso tienen vencimiento). Explorador y Productor son gratuitos.
export const PLANES_DE_PAGO = [...PLANES_BASE, 'Premium'] as const;
// Escalera de acceso al contacto (Ronda 22): cada nivel incluye lo del anterior. Explorador = sin plan.
export type PlanActivo = 'Explorador' | PlanBase;
export const NIVEL_PLAN: Record<PlanActivo, number> = { Explorador: 0, Negocio: 1, Empresarial: 2, Institucional: 3 };
// Filtros avanzados del directorio: Empresarial e Institucional. Soporte prioritario: solo Institucional.
export const tieneFiltrosAvanzados = (p: PlanActivo) => NIVEL_PLAN[p] >= NIVEL_PLAN.Empresarial;
export const tieneSoportePrioritario = (p: PlanActivo) => p === 'Institucional';
// Ronda 30: mensajería directa y alertas = desde el plan Negocio (lo incluyen Empresarial e Institucional); reportes agregados = Institucional.
export const tieneMensajeriaYAlertas = (p: PlanActivo) => NIVEL_PLAN[p] >= NIVEL_PLAN.Negocio;
// Ronda 32: "Productores disponibles" viene INCLUIDO en Empresarial e Institucional; con Negocio hace falta el complemento Premium.
export const incluyeProductoresDisponibles = (p: PlanActivo) => NIVEL_PLAN[p] >= NIVEL_PLAN.Empresarial;
export const tieneReportesAgregados = (p: PlanActivo) => p === 'Institucional';
export type PlanDePago = typeof PLANES_DE_PAGO[number];
export function esPlanDePago(v: string): v is PlanDePago { return (PLANES_DE_PAGO as readonly string[]).includes(v); }

export const METODOS_PAGO = ['Yape', 'Plin'] as const;
export type MetodoPago = typeof METODOS_PAGO[number];
export function esMetodoPago(v: string): v is MetodoPago { return (METODOS_PAGO as readonly string[]).includes(v); }

export const CONCEPTOS_PAGO = ['Plan', 'Desbloqueo'] as const;
export type ConceptoPago = typeof CONCEPTOS_PAGO[number];

// Suscripciones mensuales y desbloqueo puntual: misma vigencia (30 días desde la confirmación).
export const DIAS_VIGENCIA = 30;
// Hipótesis: el documento habla de "un porcentaje" de los ingresos de Negocio/Institucional para un
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
  // Ronda 30: true = se suma ENCIMA de un plan de pago vigente (no reemplaza a ninguno).
  complemento?: boolean;
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
    incluye: ['Todo lo del plan Explorador', 'Contactos ilimitados de productores', 'Mensajería directa en la plataforma con los productores contactables', 'Alertas de disponibilidad y de temporada de las plantas que sigas'],
    proximamente: [],
    precio: 29, precioTexto: 'S/ 29 al mes', periodicidad: 'mensual', referencial: true,
  },
  {
    id: 'Empresarial', nombre: 'Empresarial', paraQuien: 'Empresas y negocios que compran con frecuencia y necesitan filtrar la oferta de los productores',
    incluye: ['Todo lo del plan Negocio', 'Filtros avanzados en el directorio de productores: cantidad ofrecida, certificación y cercanía por zona', 'Sección "Productores disponibles" incluida, sin costo extra'],
    proximamente: [],
    precio: 99, precioTexto: 'S/ 99 al mes', periodicidad: 'mensual', referencial: true,
  },
  {
    id: 'Institucional', nombre: 'Institucional', paraQuien: 'Institutos, universidades, ONG y entidades públicas: lo paga un solo administrador en nombre de la institución',
    incluye: ['Todo lo del plan Empresarial', 'Soporte prioritario: tus consultas al equipo se marcan como "Prioritaria"', 'Reportes y datos agregados de la bioeconomía regional (por zona y categoría, sin datos personales de productores)', 'Sección "Productores disponibles" incluida, sin costo extra'],
    proximamente: [],
    precio: 120, precioTexto: 'S/ 120 al mes', periodicidad: 'mensual', referencial: true,
  },
  {
    id: 'Premium', nombre: 'Premium', complemento: true,
    paraQuien: 'Exclusivo para quien tiene el plan Negocio y quiere explorar productores disponibles sin buscar producto por producto',
    incluye: ['Se suma encima de tu plan Negocio (no lo reemplaza)', 'Sección "Productores disponibles": directorio de productores que marcaron que están disponibles para contacto ahora, con filtros por planta, zona y tipo de productor', 'Los planes Empresarial e Institucional ya la incluyen sin costo extra'],
    proximamente: [], precio: 19, precioTexto: 'S/ 19 al mes adicionales', periodicidad: 'mensual', referencial: true,
  },
  {
    id: 'Productor', nombre: 'Productor', paraQuien: 'Agricultores, comunidades, portadores de conocimiento',
    incluye: ['Publicar cultivos, preparaciones y productos gratis', 'Ficha básica visible en el mapa', 'Aparecer en el directorio de contacto una vez validada tu ficha de cultivo'],
    proximamente: [], precio: 0, precioTexto: 'Gratis', periodicidad: 'gratis', referencial: true,
  },
];
// Ronda 21: el plan "Productor Destacado" se retiró del catálogo (era un plan de venta/visibilidad, no de acceso al contacto).
// Los pagos históricos con plan='Destacado' se conservan en la base como historial, pero ya no dan ningún beneficio.

export function precioDe(id: 'DesbloqueoPuntual' | PlanDePago): number {
  const d = CATALOGO_PLANES.find((p) => p.id === id);
  if (!d) throw new Error(`Plan sin precio definido: ${id}`);
  return d.precio;
}
