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
  // no afirmaciones sobre ninguna planta real. `nombre` es @unique en el schema, por lo que
  // `skipDuplicates` hace este seed idempotente -- reejecutarlo no duplica ni pisa las filas
  // que ya existan (incluidas las 3 originales de Digestivo/Respiratorio/Antiinflamatorio).
  await prisma.uso.createMany({
    data: [
      { id: randomUUID(), nombre: 'Digestivo' },
      { id: randomUUID(), nombre: 'Respiratorio' },
      { id: randomUUID(), nombre: 'Antiinflamatorio' },
      { id: randomUUID(), nombre: 'Analgésico' },
      { id: randomUUID(), nombre: 'Antipirético/Febrífugo' },
      { id: randomUUID(), nombre: 'Antimicrobiano/Antibacteriano' },
      { id: randomUUID(), nombre: 'Antifúngico' },
      { id: randomUUID(), nombre: 'Antiparasitario' },
      { id: randomUUID(), nombre: 'Antiviral' },
      { id: randomUUID(), nombre: 'Cicatrizante' },
      { id: randomUUID(), nombre: 'Dermatológico' },
      { id: randomUUID(), nombre: 'Hepatoprotector' },
      { id: randomUUID(), nombre: 'Cardiovascular' },
      { id: randomUUID(), nombre: 'Diurético' },
      { id: randomUUID(), nombre: 'Sedante/Relajante' },
      { id: randomUUID(), nombre: 'Antioxidante' },
      { id: randomUUID(), nombre: 'Inmunoestimulante' },
      { id: randomUUID(), nombre: 'Ginecológico/Reproductivo' },
      { id: randomUUID(), nombre: 'Urológico' },
      { id: randomUUID(), nombre: 'Oftálmico' },
      { id: randomUUID(), nombre: 'Odontológico' },
      { id: randomUUID(), nombre: 'Veterinario' },
      { id: randomUUID(), nombre: 'Cosmético' },
      { id: randomUUID(), nombre: 'Alimenticio/Nutricional' },
      { id: randomUUID(), nombre: 'Ritual/Espiritual' },
    ],
    skipDuplicates: true,
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => { console.error(error); await prisma.$disconnect(); process.exit(1); });
