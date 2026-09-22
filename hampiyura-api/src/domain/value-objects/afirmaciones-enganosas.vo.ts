// RF-274: detección simple por palabras clave (no NLP) de afirmaciones médicas engañosas o
// peligrosas. No bloquea la publicación, pero marca el producto para revisión manual reforzada
// ANTES de que entre a la cola de M-09 (ver PublicarProductoUseCase).
const TERMINOS_ENGANOSOS = [
  'cura', 'curar', 'cura el', 'cura la', 'cura los', 'cura las',
  'elimina', 'eliminar', 'elimina el', 'elimina la',
  'sana', 'sanar',
  'sustituye', 'sustituye el tratamiento', 'sustituye tratamiento médico',
  'reemplaza', 'reemplaza el tratamiento', 'reemplaza tratamiento médico',
  'previene el cáncer', 'previene cáncer',
] as const;

function normalizar(texto: string): string {
  return texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function escaparRegExp(texto: string): string {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Coincidencia por límites de palabra (\b) para evitar falsos positivos como "artesanal"
// (que contiene "sana" como subcadena) o "eliminación" al buscar "elimina" sin límites.
export function contieneAfirmacionEnganosa(...textos: (string | undefined)[]): boolean {
  const contenido = normalizar(textos.filter(Boolean).join(' '));
  return TERMINOS_ENGANOSOS.some((termino) => new RegExp(`\\b${escaparRegExp(normalizar(termino))}\\b`).test(contenido));
}
