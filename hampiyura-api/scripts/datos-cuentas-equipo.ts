// Las 12 cuentas reales del equipo (docs/usuarios-equipo.md, CG-009): 4 Administrador, 2 Especialista en salud, 2 Especialista en agronomía
// y 4 Usuario registrado. Solo correos y roles: las contraseñas se generan al azar en cada instalación y NUNCA se guardan en el repo.
export interface CuentaEquipo { nombre: string; correo: string; rol: string }
export const CUENTAS_EQUIPO: CuentaEquipo[] = [
  { nombre: 'Angel', correo: 'angel@hampiyura.local', rol: 'Administrador' },
  { nombre: 'Junior', correo: 'junior@hampiyura.local', rol: 'Administrador' },
  { nombre: 'Mariela', correo: 'mariela@hampiyura.local', rol: 'Administrador' },
  { nombre: 'Norberto', correo: 'norberto@hampiyura.local', rol: 'Administrador' },
  { nombre: 'Especialista Salud 1', correo: 'especialista.salud1@hampiyura.local', rol: 'EspecialistaSalud' },
  { nombre: 'Especialista Salud 2', correo: 'especialista.salud2@hampiyura.local', rol: 'EspecialistaSalud' },
  { nombre: 'Especialista Agronomía 1', correo: 'especialista.agronomia1@hampiyura.local', rol: 'EspecialistaAgronomo' },
  { nombre: 'Especialista Agronomía 2', correo: 'especialista.agronomia2@hampiyura.local', rol: 'EspecialistaAgronomo' },
  { nombre: 'Usuario 1', correo: 'usuario1@hampiyura.local', rol: 'UsuarioRegistrado' },
  { nombre: 'Usuario 2', correo: 'usuario2@hampiyura.local', rol: 'UsuarioRegistrado' },
  { nombre: 'Usuario 3', correo: 'usuario3@hampiyura.local', rol: 'UsuarioRegistrado' },
  { nombre: 'Usuario 4', correo: 'usuario4@hampiyura.local', rol: 'UsuarioRegistrado' },
];

// Decide, cuenta por cuenta, qué crear: solo las cuyo correo EXACTO todavía no existe (sin importar qué otras cuentas haya, como el
// administrador del seed). Idempotente: con las 12 ya creadas devuelve 0 por crear.
export function planificarCuentas(existentes: { correo: string; rol: string }[], cuentas: CuentaEquipo[] = CUENTAS_EQUIPO) {
  const porCorreo = new Map(existentes.map((u) => [u.correo.trim().toLowerCase(), u]));
  const porCrear: CuentaEquipo[] = []; const yaExistian: (CuentaEquipo & { rolActual: string })[] = [];
  for (const c of cuentas) {
    const u = porCorreo.get(c.correo.toLowerCase());
    if (u) yaExistian.push({ ...c, rolActual: u.rol }); else porCrear.push(c);
  }
  return { porCrear, yaExistian };
}
