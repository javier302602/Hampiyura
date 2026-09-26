import { CUENTAS_EQUIPO, planificarCuentas } from '../../scripts/datos-cuentas-equipo';

// La condición vieja ("no debe haber ningún usuario") dejaba el script inutilizable en cuanto el seed creaba el administrador.
describe('cuentas del equipo · creación por cuenta', () => {
  test('son las 12 de CG-009: 4 Administrador, 2 Especialista en salud, 2 en agronomía y 4 Usuario; correos únicos', () => {
    expect(CUENTAS_EQUIPO).toHaveLength(12);
    expect(new Set(CUENTAS_EQUIPO.map((c) => c.correo)).size).toBe(12);
    const n = (rol: string) => CUENTAS_EQUIPO.filter((c) => c.rol === rol).length;
    expect([n('Administrador'), n('EspecialistaSalud'), n('EspecialistaAgronomo'), n('UsuarioRegistrado')]).toEqual([4, 2, 2, 4]);
  });
  test('con el administrador del seed ya creado (otro correo) se crean las 12, sin tocarlo', () => {
    const r = planificarCuentas([{ correo: 'admin@hampiyura.local', rol: 'Administrador' }]);
    expect(r.porCrear).toHaveLength(12); expect(r.yaExistian).toHaveLength(0);
  });
  test('idempotente: con las 12 ya creadas no se crea nada; con algunas, solo las que faltan', () => {
    const todas = CUENTAS_EQUIPO.map((c) => ({ correo: c.correo, rol: c.rol }));
    expect(planificarCuentas(todas).porCrear).toHaveLength(0);
    const parcial = planificarCuentas([{ correo: 'admin@hampiyura.local', rol: 'Administrador' }, ...todas.slice(0, 5)]);
    expect(parcial.yaExistian).toHaveLength(5);
    expect(parcial.porCrear.map((c) => c.correo)).toEqual(CUENTAS_EQUIPO.slice(5).map((c) => c.correo));
  });
  test('compara el correo exacto sin distinguir mayúsculas, y no toca el rol de una cuenta que ya existe', () => {
    const r = planificarCuentas([{ correo: 'ANGEL@hampiyura.local', rol: 'UsuarioRegistrado' }]);
    expect(r.yaExistian).toEqual([expect.objectContaining({ correo: 'angel@hampiyura.local', rolActual: 'UsuarioRegistrado' })]);
    expect(r.porCrear).toHaveLength(11);
  });
});
