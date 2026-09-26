// Crea las 12 cuentas del equipo (correos en docs/usuarios-equipo.md) con contraseñas ALEATORIAS, generadas aquí, en esta instalación.
//   cd hampiyura-api && npx tsx scripts/crear-cuentas-equipo.ts            -> SIMULACIÓN: muestra qué crearía, sin escribir nada
//   cd hampiyura-api && npx tsx scripts/crear-cuentas-equipo.ts --aplicar  -> crea las que falten
// IDEMPOTENTE y por cuenta: cada una se crea solo si SU correo exacto no existe todavía. No importa qué otras cuentas haya (el administrador del
// seed de Docker, por ejemplo) y se puede correr las veces que quieras sin duplicar nada ni tocar las cuentas existentes.
// Las contraseñas de las cuentas NUEVAS se escriben SOLO en credenciales-equipo-<fecha>.txt (raíz del proyecto, ignorado por git): no se
// imprimen ni se suben nunca. Si ese archivo ya existe ese día, se AÑADEN al final (no se pierden las anteriores).
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { randomUUID, randomInt } from 'crypto';
import { appendFileSync, existsSync } from 'fs';
import path from 'path';
import { CUENTAS_EQUIPO, planificarCuentas } from './datos-cuentas-equipo';

const APLICAR = process.argv.includes('--aplicar');
const prisma = new PrismaClient();

// 18 caracteres sin ambiguos (sin 0/O/1/l/I), con mayúscula, minúscula, número y símbolo garantizados.
function contraseña(): string {
  const may = 'ABCDEFGHJKLMNPQRSTUVWXYZ', min = 'abcdefghijkmnopqrstuvwxyz', num = '23456789', sim = '#$%&*+-=?@';
  const todos = may + min + num + sim;
  const pick = (s: string) => s[randomInt(s.length)];
  const chars = [pick(may), pick(min), pick(num), pick(sim)];
  while (chars.length < 18) chars.push(pick(todos));
  for (let i = chars.length - 1; i > 0; i--) { const j = randomInt(i + 1); [chars[i], chars[j]] = [chars[j], chars[i]]; }
  return chars.join('');
}

(async () => {
  const existentes = await prisma.usuario.findMany({ select: { correo: true, rol: true } });
  const { porCrear, yaExistian } = planificarCuentas(existentes);
  console.log(`\n${APLICAR ? 'CREACIÓN DE CUENTAS' : 'SIMULACIÓN (no se escribió nada)'} — cuentas en la base ahora: ${existentes.length}\n`);
  for (const c of yaExistian) console.log(`  = ya existía   ${c.correo.padEnd(42)} (rol actual: ${c.rolActual}; no se toca)`);
  for (const c of porCrear) console.log(`  ${APLICAR ? '+ creada ' : '· crearía'}     ${c.correo.padEnd(42)} ${c.rol}`);

  if (APLICAR && porCrear.length > 0) {
    const nuevas = porCrear.map((c) => ({ c, clave: contraseña() }));
    // Primero el archivo de credenciales (si no se puede escribir, se aborta ANTES de crear cuentas cuya clave se perdería).
    // CREDENCIALES_ARCHIVO (opcional) cambia dónde se escriben; por defecto, la raíz del proyecto.
    const archivo = process.env.CREDENCIALES_ARCHIVO ? path.resolve(process.env.CREDENCIALES_ARCHIVO) : path.resolve(__dirname, '..', '..', `credenciales-equipo-${new Date().toISOString().slice(0, 10)}.txt`);
    const encabezado = existsSync(archivo) ? '' : 'CREDENCIALES DEL EQUIPO HAMPIYURA -- pásalas por un canal privado y borra este archivo después.\n\n';
    appendFileSync(archivo, encabezado + nuevas.map(({ c, clave }) => `${c.rol.padEnd(22)} ${c.nombre.padEnd(26)} ${c.correo.padEnd(42)} ${clave}`).join('\n') + '\n', { mode: 0o600 });
    for (const { c, clave } of nuevas) {
      await prisma.usuario.create({ data: { id: randomUUID(), nombre: c.nombre, correo: c.correo, contraseñaHash: await bcrypt.hash(clave, 10), rol: c.rol as any, estado: 'Activo', idioma: 'es', nivelConocimiento: 'Pendiente', region: 'Pendiente' } });
    }
    console.log(`\nCredenciales de las ${nuevas.length} cuentas nuevas guardadas en: ${archivo} (no se imprimen; entrégalas por un canal privado y borra el archivo)`);
  }
  console.log(`\nTotal del equipo: ${CUENTAS_EQUIPO.length} | ya existían: ${yaExistian.length} | ${APLICAR ? 'creadas' : 'por crear'}: ${porCrear.length}`);
  if (!APLICAR && porCrear.length > 0) console.log('Para crearlas de verdad, agrega --aplicar.');
})().catch((e) => { console.error(e.message); process.exit(1); }).finally(() => prisma.$disconnect());
