// Motivo predefinido de un reporte (M-09): le da contexto a quien lo revisa sin depender de que el usuario haya
// escrito algo útil. "Otro" es el único que EXIGE la descripción en texto libre; en los demás es opcional.
export const CATEGORIAS_REPORTE = ['InformacionFalsa', 'ContenidoInapropiado', 'Spam', 'SuplantacionSinFuente', 'Otro'] as const;
export type CategoriaReporte = typeof CATEGORIAS_REPORTE[number];
export function esCategoriaReporte(v: string): v is CategoriaReporte { return (CATEGORIAS_REPORTE as readonly string[]).includes(v); }
