// Ronda 33/34: carga el contenido de EJEMPLO (9 publicaciones + 9 productos) desde una cuenta dedicada, con la foto de cada planta y su crédito.
//   npx tsx scripts/cargar-contenido-ejemplo.ts            -> SIMULACIÓN
//   npx tsx scripts/cargar-contenido-ejemplo.ts --aplicar  -> carga (idempotente: no duplica lo que ya existe, por cuenta + título)
// Los títulos ya no llevan prefijo (Ronda 34), pero la autoría "Cuenta de ejemplo" y la nota de ejemplo de cada texto se conservan. Si ya estaba
// cargado con el prefijo "[Ejemplo]" (Ronda 33), se RENOMBRA en su lugar (sin duplicar). Va directo a "publicado" (Validado): es contenido curado por el equipo, no una propuesta que necesite moderación (mismo criterio que las cargas de
// las rondas 28 a 31). Para quitarlo todo después: npx tsx scripts/borrar-contenido-ejemplo.ts --aplicar
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { randomUUID, randomBytes } from 'crypto';
import { CUENTA_EJEMPLO, PUBLICACIONES_EJEMPLO, PRODUCTOS_EJEMPLO, FUENTE_PUBLICACION, NOTA_PRODUCTO, descripcionProducto, conPrefijoAntiguo, creditoFoto } from './datos-contenido-ejemplo';
import { ZONA_NO_ESPECIFICADA } from '../src/domain/value-objects/zona-general.vo';

const APLICAR = process.argv.includes('--aplicar');
const prisma = new PrismaClient();
const binomial = (c: string) => c.replace(/\(.*?\)/g, '').split(/\s+/).filter((x) => x && x !== '×').slice(0, 2).join(' ');
const NOTA_VALIDACION = 'Contenido de ejemplo cargado por el equipo (Ronda 33/34): curado, sin moderación. Todo el contenido de esta cuenta es de demostración.';

(async () => {
  const admin = await prisma.usuario.findFirst({ where: { rol: 'Administrador', estado: 'Activo' }, orderBy: { correo: 'asc' } });
  if (!admin) throw new Error('No hay ninguna cuenta Administrador activa para registrar la carga.');
  const plantas = await prisma.planta.findMany();
  const plantaDe = (bin: string) => plantas.find((p) => binomial(p.nombreCientifico) === bin);
  const faltan = [...new Set([...PUBLICACIONES_EJEMPLO, ...PRODUCTOS_EJEMPLO].map((x) => x.bin))].filter((b) => !plantaDe(b));
  if (faltan.length) throw new Error(`Faltan plantas en el catálogo (carga primero las 27 plantas): ${faltan.join(', ')}`);

  let cuenta = await prisma.usuario.findFirst({ where: { correo: { equals: CUENTA_EJEMPLO.correo, mode: 'insensitive' } } });
  console.log(`\n${APLICAR ? 'CARGA DE CONTENIDO DE EJEMPLO' : 'SIMULACIÓN (no se escribió nada)'}\n`);
  console.log(`Cuenta dedicada: ${CUENTA_EJEMPLO.correo} (${cuenta ? 'ya existe' : APLICAR ? 'se crea' : 'se crearía'}) — rol ${CUENTA_EJEMPLO.rol}, nombre "${CUENTA_EJEMPLO.nombre}"`);
  if (!cuenta && APLICAR) {
    // Contraseña aleatoria que NO se guarda ni se muestra en ningún lado: nadie inicia sesión con esta cuenta (si algún día hiciera falta, se restablece con
    // restablecer-claves-equipo.ts --correo=ejemplo@hampiyura.local). Acepta la comisión del 5% como cualquier productor.
    cuenta = await prisma.usuario.create({ data: {
      id: randomUUID(), nombre: CUENTA_EJEMPLO.nombre, correo: CUENTA_EJEMPLO.correo, contraseñaHash: await bcrypt.hash(randomBytes(24).toString('base64url'), 10),
      rol: CUENTA_EJEMPLO.rol as any, estado: 'Activo', idioma: 'es', nivelConocimiento: 'Pendiente', region: 'Pendiente', aceptoComisionEn: new Date(),
      biografia: 'Cuenta dedicada al contenido de ejemplo de demostración. No es una persona ni un productor real.',
    } });
  }
  if (cuenta && cuenta.rol !== 'Productor') console.log(`  ⚠ la cuenta ${cuenta.correo} existe con rol ${cuenta.rol} (no se cambia)`);
  const ahora = new Date();
  let pubNuevas = 0, pubAct = 0, pubYa = 0, prodNuevos = 0, prodAct = 0, prodYa = 0;

  for (const e of PUBLICACIONES_EJEMPLO) {
    const planta = plantaDe(e.bin)!;
    const imagenes = planta.imagenPrincipal ? [planta.imagenPrincipal] : [];
    const fuente = `${FUENTE_PUBLICACION} ${creditoFoto(planta.imagenAutor, planta.imagenLicencia)}`.trim();
    const ya = cuenta ? await prisma.publicacion.findFirst({ where: { autorId: cuenta.id, nombreComun: { in: [e.titulo, conPrefijoAntiguo(e.titulo)] } } }) : null;
    if (ya) {
      const igual = ya.nombreComun === e.titulo && JSON.stringify(ya.imagenes) === JSON.stringify(imagenes) && ya.fuente === fuente;
      if (igual) { pubYa++; continue; }
      pubAct++; console.log(`  ${APLICAR ? '↻' : '·'} publicación  ${e.titulo}   (actualiza título/foto)`);
      if (APLICAR) await prisma.publicacion.update({ where: { id: ya.id }, data: { nombreComun: e.titulo, imagenes, fuente } });
      continue;
    }
    pubNuevas++; console.log(`  ${APLICAR ? '+' : '·'} publicación  ${e.titulo}   (planta: ${planta.nombreComun})`);
    if (!APLICAR) continue;
    const id = randomUUID();
    await prisma.publicacion.create({ data: {
      id, plantaId: planta.id, autorId: cuenta!.id, nombreComun: e.titulo, descripcion: e.contenido,
      enfermedadesTratadas: '', formaPreparacion: '', // el documento no da estos campos por separado: vacíos, no se inventan
      imagenes, tipoConocimiento: 'Tradicional', fuente, fechaPublicacion: ahora, estadoValidacion: 'Validado',
    } });
    await prisma.validacionContenido.create({ data: { id: randomUUID(), tipoEntidad: 'Publicacion', entidadId: id, estado: 'Validado', fecha: ahora, autorId: cuenta!.id, validadorId: admin.id, comentarioValidador: NOTA_VALIDACION } });
  }

  for (const e of PRODUCTOS_EJEMPLO) {
    const planta = plantaDe(e.bin)!;
    const fotografias = planta.imagenPrincipal ? [planta.imagenPrincipal] : [];
    const descripcion = descripcionProducto(e, creditoFoto(planta.imagenAutor, planta.imagenLicencia));
    const ya = cuenta ? await prisma.producto.findFirst({ where: { productorId: cuenta.id, nombre: { in: [e.nombre, conPrefijoAntiguo(e.nombre)] } } }) : null;
    if (ya) {
      const igual = ya.nombre === e.nombre && JSON.stringify(ya.fotografias) === JSON.stringify(fotografias) && ya.descripcion === descripcion;
      if (igual) { prodYa++; continue; }
      prodAct++; console.log(`  ${APLICAR ? '↻' : '·'} producto      ${e.nombre}   (actualiza nombre/foto)`);
      if (APLICAR) await prisma.producto.update({ where: { id: ya.id }, data: { nombre: e.nombre, fotografias, descripcion } });
      continue;
    }
    prodNuevos++; console.log(`  ${APLICAR ? '+' : '·'} producto      ${e.nombre}   ${e.precio}   (planta: ${planta.nombreComun})`);
    if (!APLICAR) continue;
    const id = randomUUID();
    await prisma.producto.create({ data: {
      id, productorId: cuenta!.id, nombre: e.nombre, descripcion, plantasIds: [planta.id], precioReferencial: e.precio, fotografias,
      localidad: ZONA_NO_ESPECIFICADA,                   // el documento no da zona
      informacionProceso: 'No aplica: producto de ejemplo, no hay un proceso real de elaboración.',
      contactoVendedor: 'Sin contacto: producto de ejemplo',  // nunca un contacto real
      categoriasUso: [], estadoValidacion: 'Validado',
    } });
    await prisma.validacionContenido.create({ data: { id: randomUUID(), tipoEntidad: 'Producto', entidadId: id, estado: 'Validado', fecha: ahora, autorId: cuenta!.id, validadorId: admin.id, comentarioValidador: NOTA_VALIDACION } });
  }
  console.log(`\n${APLICAR ? 'APLICADO' : 'SIMULACIÓN'}: publicaciones ${APLICAR ? 'creadas' : 'por crear'}: ${pubNuevas}, actualizadas: ${pubAct} (ya al día: ${pubYa}) | productos ${APLICAR ? 'creados' : 'por crear'}: ${prodNuevos}, actualizados: ${prodAct} (ya al día: ${prodYa}) | nota de producto: "${NOTA_PRODUCTO}"`);
})().catch((e) => { console.error(e.message); process.exit(1); }).finally(() => prisma.$disconnect());
