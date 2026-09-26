import { CUENTA_EJEMPLO, PUBLICACIONES_EJEMPLO, PRODUCTOS_EJEMPLO, PREFIJO_EJEMPLO, NOTA_PRODUCTO, descripcionProducto } from '../../scripts/datos-contenido-ejemplo';
import { FICHAS_PLANTAS } from '../../scripts/datos-fichas-plantas';
import { CUENTAS_EQUIPO } from '../../scripts/datos-cuentas-equipo';

// Ronda 33: el contenido de ejemplo NO debe poder confundirse jamás con contenido real.
describe('contenido de ejemplo (publicaciones y productos)', () => {
  test('9 publicaciones y 9 productos, todos con el prefijo [Ejemplo], ligados a plantas del catálogo', () => {
    expect(PUBLICACIONES_EJEMPLO).toHaveLength(9); expect(PRODUCTOS_EJEMPLO).toHaveLength(9);
    const bins = new Set(FICHAS_PLANTAS.map((f) => f.bin));
    for (const p of PUBLICACIONES_EJEMPLO) { expect(p.titulo.startsWith(PREFIJO_EJEMPLO)).toBe(true); expect(bins.has(p.bin)).toBe(true); }
    for (const p of PRODUCTOS_EJEMPLO) { expect(p.nombre.startsWith(PREFIJO_EJEMPLO)).toBe(true); expect(bins.has(p.bin)).toBe(true); }
    expect(new Set(PUBLICACIONES_EJEMPLO.map((p) => p.titulo)).size).toBe(9); expect(new Set(PRODUCTOS_EJEMPLO.map((p) => p.nombre)).size).toBe(9);
  });
  test('cada publicación conserva su aclaración de ejemplo y ningún producto pierde la nota de "no es una oferta real"', () => {
    for (const p of PUBLICACIONES_EJEMPLO) expect(p.contenido).toMatch(/ejemplo|no es un testimonio|no un testimonio/i);
    for (const p of PRODUCTOS_EJEMPLO) expect(descripcionProducto(p)).toContain(NOTA_PRODUCTO);
    expect(NOTA_PRODUCTO).toBe('Producto de ejemplo para demostración — no representa una oferta de venta real ni un productor real.');
  });
  test('los precios son los del documento', () => {
    expect(PRODUCTOS_EJEMPLO.map((p) => p.precio)).toEqual(['S/ 14', 'S/ 28', 'S/ 32', 'S/ 26', 'S/ 29', 'S/ 35', 'S/ 9', 'S/ 24', 'S/ 19']);
  });
  test('la cuenta dedicada NO es ninguna de las 12 cuentas reales del equipo y tiene rol Productor', () => {
    expect(CUENTAS_EQUIPO.map((c) => c.correo)).not.toContain(CUENTA_EJEMPLO.correo);
    expect(CUENTA_EJEMPLO).toEqual({ correo: 'ejemplo@hampiyura.local', nombre: 'Cuenta de ejemplo — HampiYura', rol: 'Productor' });
  });
  test('no aparece ninguna marca ni comercio real (el documento los cita solo como referencia de formato)', () => {
    const todo = JSON.stringify([PUBLICACIONES_EJEMPLO, PRODUCTOS_EJEMPLO]);
    for (const marca of ['Inkafarma', 'Mifarma', 'ArtStore', 'Santa Natura', 'Organix', 'Campo Grande', 'MercadoLibre', 'Perubean', 'Herbanica', "D'Nattive", '4Nomads', 'TeaGuayusa', 'Pakari', 'EcoValle', 'Inkanat', 'Fitosana']) expect(todo).not.toContain(marca);
  });
});
