import { ValidationError } from '../errors/domain.errors';

// M-16 · Datos de cobro de un producto (a dónde paga el comprador) y precio numérico. Solo lo que el vendedor declara: nada se inventa.
export const CORREO_CUENTA_EJEMPLO = 'ejemplo@hampiyura.local'; // la cuenta dedicada al contenido de demostración: sus productos NO se pueden comprar
export const MAX_DIAS_ENTREGA = 30;
export const MAX_CANTIDAD_PEDIDO = 20;

// El precio de un producto es texto libre ("S/ 14", "S/ 14.50", "14,50"). Se lee un único número con hasta 2 decimales; si es ambiguo o no hay
// número ("consultar", "S/ 1,200" -> ambiguo), el producto NO es comprable todavía: el vendedor debe dejar un precio claro.
export function precioNumerico(texto?: string | null): number | undefined {
  const m = (texto ?? '').match(/^\D*(\d+)(?:[.,](\d{1,2}))?\D*$/);
  if (!m) return undefined;
  const n = Number(`${m[1]}${m[2] ? `.${m[2]}` : ''}`);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export interface CobroInput { yape?: string; plin?: string; cuenta?: string; entregaDias?: number }
export interface CobroValido { yape?: string; plin?: string; cuenta?: string; entregaDias: number }
const celular = (v: string | undefined, medio: string) => {
  const t = (v ?? '').replace(/[\s-]/g, '');
  if (!t) return undefined;
  if (!/^9\d{8}$/.test(t)) throw new ValidationError(`El número de ${medio} debe ser un celular peruano de 9 dígitos que empiece con 9`);
  return t;
};

export function validarCobro(i: CobroInput): CobroValido {
  const yape = celular(i.yape, 'Yape'); const plin = celular(i.plin, 'Plin');
  const cuenta = (i.cuenta ?? '').trim() || undefined;
  if (cuenta && (cuenta.length < 8 || cuenta.length > 120)) throw new ValidationError('La cuenta bancaria (banco y número o CCI) debe tener entre 8 y 120 caracteres');
  if (!yape && !plin && !cuenta) throw new ValidationError('Indica al menos un medio de cobro: Yape, Plin o cuenta bancaria');
  const dias = i.entregaDias;
  if (!Number.isInteger(dias) || (dias as number) < 1 || (dias as number) > MAX_DIAS_ENTREGA) throw new ValidationError(`El plazo de entrega debe ser de 1 a ${MAX_DIAS_ENTREGA} días`);
  return { ...(yape ? { yape } : {}), ...(plin ? { plin } : {}), ...(cuenta ? { cuenta } : {}), entregaDias: dias as number };
}
