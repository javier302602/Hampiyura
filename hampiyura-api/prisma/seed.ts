import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { ContraseñaSegura } from '../src/domain/value-objects/contrasena-segura.vo';

// Seed IDEMPOTENTE: se puede correr en cada despliegue sin duplicar nada.
//
//   Siempre:                    catálogo de 25 usos/finalidades + 3 plantas amazónicas base.
//   SEED_ADMIN_CORREO +
//   SEED_ADMIN_PASSWORD:        crea (o promueve) la cuenta Administrador inicial. Sin ella nadie
//                               podría validar contenido: el rol no se puede autoasignar desde la app.
//   SEED_DATOS_DE_PRUEBA=true:  además, 2 plantas "[DATO DE PRUEBA]" para desarrollo local.
const prisma = new PrismaClient();

// Catálogo de usos/finalidades (RF-256): categorías genéricas de estandarización, no afirmaciones
// sobre ninguna planta real. `nombre` es @unique, así que skipDuplicates hace el seed idempotente.
const USOS = [
  'Digestivo', 'Respiratorio', 'Antiinflamatorio', 'Analgésico', 'Antipirético/Febrífugo',
  'Antimicrobiano/Antibacteriano', 'Antifúngico', 'Antiparasitario', 'Antiviral', 'Cicatrizante',
  'Dermatológico', 'Hepatoprotector', 'Cardiovascular', 'Diurético', 'Sedante/Relajante',
  'Antioxidante', 'Inmunoestimulante', 'Ginecológico/Reproductivo', 'Urológico', 'Oftálmico',
  'Odontológico', 'Veterinario', 'Cosmético', 'Alimenticio/Nutricional', 'Ritual/Espiritual',
];

// Plantas base del catálogo. El frontend asocia la fotografía por nombreCientifico
// (src/modules/m02-catalogo-plantas/components/imagen-planta.ts), así que basta con que existan.
const PLANTAS_BASE = [
  {
    nombreComun: 'Uña de gato', nombreCientifico: 'Uncaria tomentosa', familia: 'Rubiaceae',
    region: 'Selva central del Perú (200-800 msnm): Huánuco, Junín, Ucayali, Pasco, Loreto, Madre de Dios, San Martín',
    habitat: 'Selva tropical, 200-800 msnm',
  },
  {
    nombreComun: 'Sangre de grado', nombreCientifico: 'Croton lechleri', familia: 'Euphorbiaceae',
    region: 'Tierras bajas de la Amazonía peruana, hasta 1000 msnm',
    habitat: 'Bosque tropical de tierras bajas, hasta 1000 msnm',
  },
  {
    nombreComun: 'Chuchuhuasi', nombreCientifico: 'Maytenus macrocarpa', familia: 'Celastraceae',
    region: 'No especificado en la fuente consultada — pendiente de confirmar zona de crecimiento con fuente oficial',
    habitat: 'No especificado en la fuente consultada — pendiente de confirmar hábitat con fuente oficial',
  },
];

const PLANTAS_DE_PRUEBA = [
  { nombreComun: '[DATO DE PRUEBA] Planta de ejemplo 1', nombreCientifico: 'Testus exampleus', familia: 'Familia de prueba', region: 'Región de prueba', habitat: 'Hábitat de prueba' },
  { nombreComun: '[DATO DE PRUEBA] Planta de ejemplo 2', nombreCientifico: 'Testus exampleus secundus', familia: 'Familia de prueba', region: 'Región de prueba', habitat: 'Hábitat de prueba' },
];

async function asegurarPlantas(plantas: typeof PLANTAS_BASE) {
  let creadas = 0;
  for (const p of plantas) {
    // Planta no tiene ningún campo @unique de negocio: se busca por nombre científico + común.
    const existe = await prisma.planta.findFirst({ where: { nombreCientifico: p.nombreCientifico, nombreComun: p.nombreComun } });
    if (!existe) { await prisma.planta.create({ data: { id: randomUUID(), ...p } }); creadas++; }
  }
  return creadas;
}

async function asegurarAdministrador() {
  const correo = process.env.SEED_ADMIN_CORREO?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!correo && !password) { console.log('· Admin inicial: omitido (define SEED_ADMIN_CORREO y SEED_ADMIN_PASSWORD para crearlo)'); return; }
  if (!correo || !password) throw new Error('SEED_ADMIN_CORREO y SEED_ADMIN_PASSWORD deben definirse juntas');

  const existente = await prisma.usuario.findUnique({ where: { correo } });
  if (existente) {
    // No se toca la contraseña de una cuenta que ya existe; solo se garantiza el rol y que esté activa.
    await prisma.usuario.update({ where: { correo }, data: { rol: 'Administrador', estado: 'Activo' } });
    console.log(`· Admin inicial: la cuenta ${correo} ya existía -> rol Administrador, estado Activo (contraseña sin cambios)`);
    return;
  }
  const segura = new ContraseñaSegura(password); // mismas reglas que el registro: 8+ caracteres, letras y números
  await prisma.usuario.create({
    data: {
      id: randomUUID(), nombre: process.env.SEED_ADMIN_NOMBRE?.trim() || 'Administrador', correo,
      contraseñaHash: await bcrypt.hash(segura.valor, 10), rol: 'Administrador', estado: 'Activo',
      idioma: 'es', nivelConocimiento: 'Pendiente', region: 'Pendiente',
    },
  });
  console.log(`· Admin inicial: creada la cuenta ${correo}`);
}

async function main() {
  const usos = await prisma.uso.createMany({ data: USOS.map((nombre) => ({ id: randomUUID(), nombre })), skipDuplicates: true });
  console.log(`· Usos/finalidades: ${usos.count} nuevos (catálogo objetivo: ${USOS.length})`);

  console.log(`· Plantas base: ${await asegurarPlantas(PLANTAS_BASE)} nuevas (de ${PLANTAS_BASE.length})`);

  if (process.env.SEED_DATOS_DE_PRUEBA === 'true') {
    console.log(`· Datos de prueba: ${await asegurarPlantas(PLANTAS_DE_PRUEBA)} plantas "[DATO DE PRUEBA]" nuevas`);
  }

  await asegurarAdministrador();
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => { console.error(error); await prisma.$disconnect(); process.exit(1); });
