// Ronda 31: carga el estado de conservación (IUCN + D.S. 043-2006-AG) de las 27 plantas en la base REAL.
//   npx tsx scripts/cargar-conservacion.ts            -> SIMULACIÓN
//   npx tsx scripts/cargar-conservacion.ts --aplicar  -> aplica (idempotente)
// Datos: scripts/datos-conservacion.ts (del archivo docs/plantas medicinales/HAMPIYURA_Estado_Conservacion_27_Especies.md).
import { PrismaClient } from '@prisma/client';
import { CONSERVACION } from './datos-conservacion';
import { categoriaDeRiesgo } from '../src/domain/value-objects/evaluacion-conservacion.vo';

const APLICAR = process.argv.includes('--aplicar');
const prisma = new PrismaClient();
// jsonb no conserva el orden de las claves: se compara con las claves ordenadas para que la carga sea idempotente de verdad.
const estable = (v: unknown): string => JSON.stringify(v, (_k, x) => (x && typeof x === "object" && !Array.isArray(x) ? Object.fromEntries(Object.entries(x).sort(([a], [b]) => a.localeCompare(b))) : x));
const binomial = (c: string) => c.replace(/\(.*?\)/g, '').split(/\s+/).filter((x) => x && x !== '×').slice(0, 2).join(' ');

(async () => {
  const todas = await prisma.planta.findMany();
  let cambios = 0, sinPlanta = 0;
  for (const [bin, ev] of Object.entries(CONSERVACION)) {
    const p = todas.find((x) => binomial(x.nombreCientifico) === bin);
    if (!p) { sinPlanta++; console.log(`✗ No está en la BD: ${bin}`); continue; }
    if (estable(p.evaluacionConservacion) === estable(ev)) continue;
    cambios++;
    if (APLICAR) await prisma.planta.update({ where: { id: p.id }, data: { evaluacionConservacion: ev as any } });
    const riesgo = categoriaDeRiesgo(ev);
    console.log(`${APLICAR ? '✔' : '·'} ${bin.padEnd(28)} IUCN: ${(ev.iucn?.categoria ?? (ev.pendiente ? 'PENDIENTE' : '—')).padEnd(9)} Perú: ${(ev.peru?.categoria ?? '—').padEnd(3)} ${riesgo ? '← EN RIESGO (' + riesgo + ')' : ''}`);
  }
  console.log(`\n${APLICAR ? 'APLICADO' : 'SIMULACIÓN'}: plantas a actualizar/actualizadas: ${cambios} | sin planta en la BD: ${sinPlanta} | total en el archivo: ${Object.keys(CONSERVACION).length}`);
})().catch((e) => { console.error(e.message); process.exit(1); }).finally(() => prisma.$disconnect());
