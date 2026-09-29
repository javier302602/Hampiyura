import { Producto, ProductoProps } from '../../src/domain/entities/producto.entity';

// Ronda 36 (M-16): stock REAL de un producto, gestionado directamente en la entidad (no un mock aparte).
const base = (over: Partial<ProductoProps> = {}): ProductoProps => ({
  id: 'p1', productorId: 'v1', nombre: 'Jabón', plantasIds: ['pl1'], fotografias: [], localidad: 'Tingo María, Huánuco',
  informacionProceso: 'x', contactoVendedor: 'x', requiereRevisionReforzada: false, etiquetaValidadoDocumental: false, etiquetaCertificado: false,
  estadoValidacion: 'Validado', ...over,
});

describe('Producto · stock real', () => {
  test('sin stock gestionado (undefined/null), siempre hay stock para cualquier cantidad', () => {
    const p = new Producto(base());
    expect(p.hayStockPara(1)).toBe(true); expect(p.hayStockPara(1000)).toBe(true);
    p.descontarStock(5); // no hace nada si no se gestiona
    expect(p.props.stockDisponible).toBeUndefined();
  });
  test('fijarStock valida: entero >= 0, o null para dejar de gestionarlo', () => {
    const p = new Producto(base());
    expect(() => p.fijarStock(-1)).toThrow(/entero/);
    expect(() => p.fijarStock(1.5)).toThrow(/entero/);
    p.fijarStock(10); expect(p.props.stockDisponible).toBe(10);
    p.fijarStock(0); expect(p.props.stockDisponible).toBe(0);
    p.fijarStock(null); expect(p.props.stockDisponible).toBeNull();
  });
  test('hayStockPara/descontarStock respetan el número fijado y nunca bajan de 0', () => {
    const p = new Producto(base({ stockDisponible: 3 }));
    expect(p.hayStockPara(3)).toBe(true); expect(p.hayStockPara(4)).toBe(false);
    p.descontarStock(2); expect(p.props.stockDisponible).toBe(1);
    p.descontarStock(5); expect(p.props.stockDisponible).toBe(0); // nunca negativo
    expect(p.hayStockPara(1)).toBe(false);
  });
});
