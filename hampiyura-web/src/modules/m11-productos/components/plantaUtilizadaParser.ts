import type { Planta } from '../../m02-catalogo-plantas/api/plantas.api';
import type { PlantaUtilizada } from '../api/productos.api';

// Frente 3: "el usuario escribe la planta y su forma (ej. 'hoja seca')... el sistema estructura
// eso en planta/parte usada/estado/cantidad". Esto NO es NLP real -- es un parser determinista por
// palabras clave sobre los vocabularios que el propio pedido definió (partes/estados). Se muestra
// SIEMPRE el resultado en campos editables (ver PublicarProductoForm) para que la persona corrija
// si el parseo se equivocó, en vez de confiar ciegamente en la heurística.
export const PARTES_PLANTA = ['Hoja', 'Fruto', 'Raíz', 'Corteza', 'Flor', 'Semilla', 'Tallo', 'Resina', 'Planta entera'] as const;
export const ESTADOS_PARTE = ['Seco', 'Fresco/verde', 'Molido', 'En pasta', 'En esencia/aceite', 'En jugo'] as const;
export const UNIDADES_CANTIDAD = ['g', 'kg', 'ml', 'l', 'unidades'] as const;

const PARTE_KEYWORDS: Record<string, (typeof PARTES_PLANTA)[number]> = {
  hoja: 'Hoja', hojas: 'Hoja',
  fruto: 'Fruto', frutos: 'Fruto', fruta: 'Fruto', frutas: 'Fruto',
  raiz: 'Raíz', raices: 'Raíz',
  corteza: 'Corteza', cortezas: 'Corteza',
  flor: 'Flor', flores: 'Flor',
  semilla: 'Semilla', semillas: 'Semilla',
  tallo: 'Tallo', tallos: 'Tallo',
  resina: 'Resina',
};
const ESTADO_KEYWORDS: Record<string, (typeof ESTADOS_PARTE)[number]> = {
  seco: 'Seco', seca: 'Seco', secos: 'Seco', secas: 'Seco',
  fresco: 'Fresco/verde', fresca: 'Fresco/verde', verde: 'Fresco/verde', verdes: 'Fresco/verde',
  molido: 'Molido', molida: 'Molido', molidos: 'Molido', molidas: 'Molido',
  pasta: 'En pasta',
  esencia: 'En esencia/aceite', aceite: 'En esencia/aceite',
  jugo: 'En jugo', zumo: 'En jugo',
};
const PALABRAS_VACIAS = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'su', 'en', 'y']);

function sinAcentos(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

// Bug real encontrado al verificar con Playwright: comparar el texto restante (con "de" ya
// quitado como palabra vacía) contra el nombre del catálogo TAL CUAL fallaba para nombres que
// contienen "de" en el propio nombre (ej. "Uña de gato" nunca matcheaba con "uña gato"). Se quitan
// las mismas palabras vacías de AMBOS lados antes de comparar.
function normalizarParaMatch(texto: string): string {
  return sinAcentos(texto.toLowerCase())
    .split(/\s+/)
    .filter((palabra) => palabra && !PALABRAS_VACIAS.has(palabra))
    .join(' ')
    .trim();
}

export interface ResultadoParseo {
  plantaId?: string;
  plantaNombreLibre: string;
  parteUsada: string;
  estado: string;
}

// Intenta resolver el nombre de planta restante contra el catálogo: match si el nombre común (o
// científico) de una planta aparece dentro del texto, o el texto aparece dentro del nombre.
function emparejarPlanta(textoRestante: string, catalogo: Planta[]): Planta | undefined {
  const normalizado = normalizarParaMatch(textoRestante);
  if (!normalizado) return undefined;
  return catalogo.find((p) => {
    const comun = normalizarParaMatch(p.nombreComun);
    const cientifico = normalizarParaMatch(p.nombreCientifico);
    return comun.includes(normalizado) || normalizado.includes(comun) || cientifico.includes(normalizado) || normalizado.includes(cientifico);
  });
}

export function parsearEntradaPlanta(texto: string, catalogo: Planta[]): ResultadoParseo {
  const palabras = texto.trim().split(/\s+/).filter(Boolean);
  let parteUsada = '';
  let estado = '';
  const restantes: string[] = [];
  for (const palabra of palabras) {
    const clave = sinAcentos(palabra.toLowerCase()).replace(/[.,;]/g, '');
    if (!parteUsada && PARTE_KEYWORDS[clave]) { parteUsada = PARTE_KEYWORDS[clave]; continue; }
    if (!estado && ESTADO_KEYWORDS[clave]) { estado = ESTADO_KEYWORDS[clave]; continue; }
    if (PALABRAS_VACIAS.has(clave)) continue;
    restantes.push(palabra);
  }
  const nombreLibre = restantes.join(' ').trim() || texto.trim();
  const planta = emparejarPlanta(nombreLibre, catalogo);
  return {
    plantaId: planta?.id,
    plantaNombreLibre: planta?.nombreComun ?? nombreLibre,
    parteUsada: parteUsada || 'Hoja',
    estado: estado || 'Fresco/verde',
  };
}

export function entradaVacia(): PlantaUtilizada {
  return { plantaNombreLibre: '', parteUsada: 'Hoja', estado: 'Fresco/verde', cantidad: '' };
}
