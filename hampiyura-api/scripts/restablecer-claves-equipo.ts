// Restablece la contraseña de cuentas que YA existen, con una contraseña nueva ALEATORIA por cuenta. Sirve cuando nadie sabe con qué clave
// entrar (p. ej. se usó el archivo de credenciales de otro entorno): las claves nuevas se escriben SOLO en credenciales-equipo-<fecha>.txt
// (ignorado por git; no se imprimen). Después de guardar cada una se comprueba que la clave nueva valida contra el hash guardado.
//   npx tsx scripts/restablecer-claves-equipo.ts                              -> SIMULACIÓN sobre las 12 cuentas del equipo
//   npx tsx scripts/restablecer-claves-equipo.ts --aplicar                    -> restablece las 12 (las que existan)
//   npx tsx scripts/restablecer-claves-equipo.ts --aplicar --correo=admin@hampiyura.local --correo=otra@x.com   -> solo esas cuentas
// Una cuenta Suspendida NO se reactiva (queda avisado); una pendiente de activación sí se deja Activa (si no, no podría entrar).
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { CUENTAS_EQUIPO } from './datos-cuentas-equipo';
import { contraseñaAleatoria, escribirCredenciales, rutaCredenciales } from './util-credenciales';

const APLICAR = process.argv.includes('--aplicar');
const pedidos = process.argv.filter((a) => a.startsWith('--correo=')).map((a) => a.slice('--correo='.length).trim().toLowerCase()).filter(Boolean);
const prisma = new PrismaClient();

(async () => {
  const objetivo = pedidos.length ? pedidos : CUENTAS_EQUIPO.map((c) => c.correo);
  const usuarios = await prisma.usuario.findMany({ where: { OR: objetivo.map((c) => ({ correo: { equals: c, mode: 'insensitive' as const } })) } });
  const porCorreo = new Map(usuarios.map((u) => [u.correo.toLowerCase(), u]));
  console.log(`\n${APLICAR ? 'RESTABLECIMIENTO DE CLAVES' : 'SIMULACIÓN (no se escribió nada)'}\n`);
  const hechas: { rol: string; nombre: string; correo: string; clave: string; id: string; activar: boolean }[] = [];
  for (const correo of objetivo) {
    const u = porCorreo.get(correo);
    if (!u) { console.log(`  ✗ no existe   ${correo}  (créala con crear-cuentas-equipo.ts)`); continue; }
    if (u.estado === 'Suspendido') { console.log(`  ⊘ suspendida  ${u.correo}  (no se toca: reactívala desde Gestión → Usuarios si corresponde)`); continue; }
    hechas.push({ rol: u.rol, nombre: u.nombre, correo: u.correo, clave: contraseñaAleatoria(), id: u.id, activar: u.estado !== 'Activo' });
    console.log(`  ${APLICAR ? '↻ restablecida' : '· restablecería'}  ${u.correo.padEnd(42)} ${u.rol}${u.estado !== 'Activo' ? `  (estado ${u.estado} -> Activo)` : ''}`);
  }
  if (APLICAR && hechas.length > 0) {
    const archivo = rutaCredenciales();
    escribirCredenciales(archivo, hechas); // primero el archivo: si no se puede escribir, se aborta antes de cambiar ninguna clave
    let verificadas = 0;
    for (const h of hechas) {
      const hash = await bcrypt.hash(h.clave, 10);
      await prisma.usuario.update({ where: { id: h.id }, data: { contraseñaHash: hash, ...(h.activar ? { estado: 'Activo' as const } : {}) } });
      const guardado = await prisma.usuario.findUniqueOrThrow({ where: { id: h.id } });
      if (await bcrypt.compare(h.clave, guardado.contraseñaHash)) verificadas++;
    }
    console.log(`\nClaves nuevas de ${hechas.length} cuentas guardadas en: ${archivo} (no se imprimen; entrégalas por un canal privado y borra el archivo).`);
    console.log(`Verificación: ${verificadas} de ${hechas.length} claves nuevas validan contra el hash guardado en la base.`);
  }
  console.log(`\nCuentas objetivo: ${objetivo.length} | ${APLICAR ? 'restablecidas' : 'por restablecer'}: ${hechas.length}`);
  if (!APLICAR && hechas.length > 0) console.log('Para restablecerlas de verdad, agrega --aplicar.');
})().catch((e) => { console.error(e.message); process.exit(1); }).finally(() => prisma.$disconnect());
