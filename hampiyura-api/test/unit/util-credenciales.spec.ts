import { contraseñaAleatoria } from '../../scripts/util-credenciales';
import { ContraseñaSegura } from '../../src/domain/value-objects/contrasena-segura.vo';

// Las claves del equipo se pasan por chat y se escriben a mano: deben ser fáciles de copiar (sin símbolos ni caracteres ambiguos).
describe('contraseña aleatoria del equipo', () => {
  test('16 caracteres, solo letras y números sin ambiguos, con mayúscula, minúscula y número', () => {
    for (let i = 0; i < 200; i++) {
      const c = contraseñaAleatoria();
      expect(c).toHaveLength(16);
      expect(c).toMatch(/^[A-HJ-NP-Za-km-z2-9]+$/); // sin 0 O 1 l I ni símbolos (un "-" o un "#" al borde se pierde al copiar)
      expect(c).toMatch(/[A-Z]/); expect(c).toMatch(/[a-z]/); expect(c).toMatch(/[2-9]/);
      expect(() => new ContraseñaSegura(c)).not.toThrow(); // cumple las reglas del registro
    }
  });
  test('son distintas en cada llamada', () => {
    expect(new Set(Array.from({ length: 100 }, () => contraseñaAleatoria())).size).toBe(100);
  });
});
