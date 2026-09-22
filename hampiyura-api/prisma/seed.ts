import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

// Datos de prueba para desarrollo local. NO son información botánica real; solo sirven para
// verificar que el flujo de catálogo (M-02) funciona de punta a punta.
const prisma = new PrismaClient();

async function main() {
  await prisma.planta.createMany({
    data: [
      { id: randomUUID(), nombreComun: '[DATO DE PRUEBA] Planta de ejemplo 1', nombreCientifico: 'Testus exampleus', familia: 'Familia de prueba', region: 'Región de prueba', habitat: 'Hábitat de prueba' },
      { id: randomUUID(), nombreComun: '[DATO DE PRUEBA] Planta de ejemplo 2', nombreCientifico: 'Testus exampleus secundus', familia: 'Familia de prueba', region: 'Región de prueba', habitat: 'Hábitat de prueba' },
    ],
    skipDuplicates: true,
  });

  // Catálogo de usos/finalidades (RF-256): son categorías genéricas de estandarización,
  // no afirmaciones sobre ninguna planta real. Nombres tomados directamente de los ejemplos
  // del propio SDS (cap. 11.4), no inventados en esta sesión.
  await prisma.uso.createMany({
    data: [
      { id: randomUUID(), nombre: 'Digestivo' },
      { id: randomUUID(), nombre: 'Respiratorio' },
      { id: randomUUID(), nombre: 'Antiinflamatorio' },
    ],
    skipDuplicates: true,
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => { console.error(error); await prisma.$disconnect(); process.exit(1); });
