// Utilidades compartidas por crear-cuentas-equipo.ts y restablecer-claves-equipo.ts: contraseña aleatoria y archivo de credenciales.
// Las contraseñas NUNCA se imprimen ni se guardan en el repo: solo en credenciales-equipo-<fecha>.txt (ignorado por git).
import { randomInt } from 'crypto';
import { appendFileSync, existsSync } from 'fs';
import path from 'path';

// 18 caracteres sin ambiguos (sin 0/O/1/l/I), con mayúscula, minúscula, número y símbolo garantizados.
export function contraseñaAleatoria(): string {
  const may = 'ABCDEFGHJKLMNPQRSTUVWXYZ', min = 'abcdefghijkmnopqrstuvwxyz', num = '23456789', sim = '#$%&*+-=?@';
  const todos = may + min + num + sim;
  const pick = (s: string) => s[randomInt(s.length)];
  const chars = [pick(may), pick(min), pick(num), pick(sim)];
  while (chars.length < 18) chars.push(pick(todos));
  for (let i = chars.length - 1; i > 0; i--) { const j = randomInt(i + 1); [chars[i], chars[j]] = [chars[j], chars[i]]; }
  return chars.join('');
}

// CREDENCIALES_ARCHIVO (opcional) cambia dónde se escriben; por defecto, dos carpetas arriba de scripts/ (la raíz del proyecto en local).
export function rutaCredenciales(): string {
  return process.env.CREDENCIALES_ARCHIVO ? path.resolve(process.env.CREDENCIALES_ARCHIVO) : path.resolve(__dirname, '..', '..', `credenciales-equipo-${new Date().toISOString().slice(0, 10)}.txt`);
}

// Añade las líneas al archivo (con encabezado si es nuevo). Lanza si no se puede escribir: así se aborta ANTES de tocar la base.
export function escribirCredenciales(archivo: string, filas: { rol: string; nombre: string; correo: string; clave: string }[]) {
  const encabezado = existsSync(archivo) ? '' : 'CREDENCIALES DEL EQUIPO HAMPIYURA -- pásalas por un canal privado y borra este archivo después.\n\n';
  appendFileSync(archivo, encabezado + filas.map((f) => `${f.rol.padEnd(22)} ${f.nombre.padEnd(26)} ${f.correo.padEnd(42)} ${f.clave}`).join('\n') + '\n', { mode: 0o600 });
}
