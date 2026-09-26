// Diagnóstico de "no puedo iniciar sesión": muestra CONTRA QUÉ base de datos corre, qué cuentas existen y en qué estado, y (opcional) si una
// clave concreta valida. NO modifica nada y NUNCA imprime contraseñas ni hashes.
//   npx tsx scripts/diagnosticar-login.ts
//   CLAVE_PRUEBA='la-clave' npx tsx scripts/diagnosticar-login.ts junior@hampiyura.local     -> prueba esa clave contra ese correo
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { CUENTAS_EQUIPO } from './datos-cuentas-equipo';

const prisma = new PrismaClient();
const base = (() => { try { const u = new URL(process.env.DATABASE_URL ?? ''); return `${u.hostname}:${u.port || '5432'}${u.pathname}`; } catch { return '(DATABASE_URL no definida o inválida)'; } })();

(async () => {
  console.log(`\nBase de datos consultada: ${base}`);
  const todos = await prisma.usuario.findMany({ select: { correo: true, rol: true, estado: true, contraseñaHash: true } });
  console.log(`Cuentas en esa base: ${todos.length}\n`);
  const por = new Map(todos.map((u) => [u.correo.toLowerCase(), u]));
  let problemas = 0;
  for (const c of CUENTAS_EQUIPO) {
    const u = por.get(c.correo.toLowerCase());
    const hashOk = !!u && /^\$2[aby]\$\d\d\$/.test(u.contraseñaHash);
    const fallo = !u ? 'NO EXISTE en esta base' : u.estado !== 'Activo' ? `estado ${u.estado} (no puede entrar)` : !hashOk ? 'el hash de la contraseña no parece bcrypt' : u.correo !== u.correo.toLowerCase() ? 'correo guardado con mayúsculas (el login ya lo tolera)' : '';
    if (fallo && !fallo.startsWith('correo guardado')) problemas++;
    console.log(`  ${fallo ? '✗' : '✔'} ${c.correo.padEnd(42)} ${u ? `${u.rol.padEnd(20)} ${u.estado}` : ''} ${fallo}`);
  }
  const otros = todos.filter((u) => !CUENTAS_EQUIPO.some((c) => c.correo === u.correo.toLowerCase()));
  console.log(`\nOtras cuentas (no del equipo): ${otros.length}${otros.length ? ' -> ' + otros.map((u) => `${u.correo} [${u.rol}, ${u.estado}]`).join(', ') : ''}`);

  const correoPrueba = process.argv[2]?.trim().toLowerCase(); const clave = process.env.CLAVE_PRUEBA;
  if (correoPrueba && clave !== undefined) {
    const u = por.get(correoPrueba);
    console.log(`\nPrueba de clave para ${correoPrueba}: ${!u ? 'la cuenta NO existe en esta base' : (await bcrypt.compare(clave, u.contraseñaHash)) ? 'la clave VALIDA ✔' : 'la clave NO valida ✘ (es otra clave: restablécela con restablecer-claves-equipo.ts)'}`);
    if (clave !== clave.trim()) console.log('  ⚠ la clave que pasaste tiene espacios al principio o al final: revisa el copiado.');
  }
  console.log(problemas === 0 ? '\nTodas las cuentas del equipo existen y están activas en ESTA base.' : `\n${problemas} cuenta(s) del equipo con problema en ESTA base.`);
  if (todos.length === 0) console.log('La base está VACÍA: no corrió el seed ni la creación de cuentas contra esta base.');
})().catch((e) => { console.error(e.message); process.exit(1); }).finally(() => prisma.$disconnect());
