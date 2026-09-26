// Ronda 33: BORRA todo el contenido de ejemplo (publicaciones y productos de la cuenta dedicada con prefijo "[Ejemplo]") y, opcionalmente, la cuenta.
//   npx tsx scripts/borrar-contenido-ejemplo.ts                         -> SIMULACIÓN: cuenta qué borraría
//   npx tsx scripts/borrar-contenido-ejemplo.ts --aplicar               -> borra publicaciones, productos y sus registros de validación
//   npx tsx scripts/borrar-contenido-ejemplo.ts --aplicar --cuenta      -> además borra la cuenta ejemplo@hampiyura.local
// Solo toca filas de ESA cuenta cuyo título empieza por "[Ejemplo]": nunca contenido real ni de otras cuentas.
import { PrismaClient } from '@prisma/client';
import { CUENTA_EJEMPLO, PREFIJO_EJEMPLO } from './datos-contenido-ejemplo';

const APLICAR = process.argv.includes('--aplicar');
const BORRAR_CUENTA = process.argv.includes('--cuenta');
const prisma = new PrismaClient();

(async () => {
  const cuenta = await prisma.usuario.findFirst({ where: { correo: { equals: CUENTA_EJEMPLO.correo, mode: 'insensitive' } } });
  console.log(`\n${APLICAR ? 'BORRADO DEL CONTENIDO DE EJEMPLO' : 'SIMULACIÓN (no se borró nada)'}\n`);
  if (!cuenta) { console.log(`No existe la cuenta ${CUENTA_EJEMPLO.correo}: no hay contenido de ejemplo que borrar.`); return; }
  const pubs = await prisma.publicacion.findMany({ where: { autorId: cuenta.id, nombreComun: { startsWith: PREFIJO_EJEMPLO } } });
  const prods = await prisma.producto.findMany({ where: { productorId: cuenta.id, nombre: { startsWith: PREFIJO_EJEMPLO } } });
  console.log(`Publicaciones de ejemplo: ${pubs.length} | productos de ejemplo: ${prods.length}`);
  if (APLICAR) {
    const ids = [...pubs.map((p) => p.id), ...prods.map((p) => p.id)];
    const val = await prisma.validacionContenido.deleteMany({ where: { entidadId: { in: ids } } });
    await prisma.comentario.deleteMany({ where: { publicacionId: { in: pubs.map((p) => p.id) } } }).catch(() => undefined);
    await prisma.valoracion.deleteMany({ where: { publicacionId: { in: pubs.map((p) => p.id) } } }).catch(() => undefined);
    await prisma.publicacion.deleteMany({ where: { id: { in: pubs.map((p) => p.id) } } });
    await prisma.producto.deleteMany({ where: { id: { in: prods.map((p) => p.id) } } });
    console.log(`Borrados: ${pubs.length} publicaciones, ${prods.length} productos y ${val.count} registros de validación.`);
    if (BORRAR_CUENTA) {
      const restos = (await prisma.publicacion.count({ where: { autorId: cuenta.id } })) + (await prisma.producto.count({ where: { productorId: cuenta.id } }));
      if (restos > 0) console.log(`La cuenta NO se borró: aún tiene ${restos} publicaciones/productos que no son de ejemplo.`);
      else { await prisma.notificacion.deleteMany({ where: { usuarioId: cuenta.id } }); await prisma.usuario.delete({ where: { id: cuenta.id } }); console.log(`Cuenta ${CUENTA_EJEMPLO.correo} borrada.`); }
    }
  } else if (pubs.length + prods.length > 0) console.log('Para borrarlo de verdad, agrega --aplicar (y --cuenta para borrar también la cuenta).');
})().catch((e) => { console.error(e.message); process.exit(1); }).finally(() => prisma.$disconnect());
