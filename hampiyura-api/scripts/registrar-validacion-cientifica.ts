// Ronda 30 (fase 2): registra la validación científica (RF-257) de las combinaciones Parte+Uso cargadas como CIENTÍFICO en la Ronda 28,
// para que se active el sello "verificado". Usa el mismo método de dominio que el formulario "Registrar validación científica"
// (ParteUso.registrarValidacionCientifica): mismas reglas de evidencia concreta, fecha y enlace.
//   npx tsx scripts/registrar-validacion-cientifica.ts            -> SIMULACIÓN
//   npx tsx scripts/registrar-validacion-cientifica.ts --aplicar  -> registra (idempotente: salta las que ya tienen validación)
// Evidencia = el resumen del estudio ya guardado en el uso (motivoUso: nivel de evidencia y resultado) + la cita de su fuente; el enlace es
// el primer DOI/URL de esa cita. NO se toca ninguna fila Documentado (su detalle sin confirmar se mantiene sin sello a propósito).
import { PrismaClient } from '@prisma/client';
import { PrismaParteUsoRepository } from '../src/infrastructure/adapters/out/persistence/prisma/repositories/prisma.repositories';

const APLICAR = process.argv.includes('--aplicar');
const prisma = new PrismaClient();
const ESPECIALISTA = 'Equipo HampiYura (revisión de la evidencia citada)';

// Excluidas a propósito (se reportan, no se sellan): el sello "verificado científicamente" sería engañoso.
//  - Ojé: el estudio citado es de SEGURIDAD (casos de toxicidad y muertes con el látex); no respalda el uso antiparasitario.
//  - Hercampuri: los estudios citados son de otra especie del complejo (Gentianella nitida); la identidad de G. alborosea no está confirmada.
const EXCLUIDAS = [
  { bin: 'Ficus insipida', motivo: 'el estudio citado documenta toxicidad y muertes con el látex; no respalda el uso antiparasitario' },
  { bin: 'Gentianella alborosea', motivo: 'los estudios citados corresponden a Gentianella nitida; la identidad de G. alborosea no está confirmada' },
];
const binomial = (c: string) => c.replace(/\(.*?\)/g, '').split(/\s+/).filter((x) => x && x !== '×').slice(0, 2).join(' ');
const primerEnlace = (t: string) => (t.match(/https?:\/\/[^\s·]+/) || [])[0]?.replace(/[.,;)]+$/, '');

(async () => {
  const admin = await prisma.usuario.findFirst({ where: { rol: 'Administrador', estado: 'Activo' }, orderBy: { correo: 'asc' } });
  if (!admin) throw new Error('No hay ninguna cuenta Administrador activa.');
  const repo = new PrismaParteUsoRepository(prisma);
  const filas = await prisma.parteUso.findMany({ where: { tipoConocimiento: 'Científico' }, include: { planta: true, uso: true }, orderBy: { id: 'asc' } });
  const hoy = new Date();
  const fecha = new Date(`${hoy.toISOString().slice(0, 10)}T12:00:00Z`);
  let hechas = 0, ya = 0, excluidas = 0;
  for (const f of filas) {
    const etiqueta = `${f.planta.nombreComun.split(' (')[0]} — ${f.parte}/${f.parteDetalle ?? ''} — ${f.uso.nombre}`;
    const excl = EXCLUIDAS.find((e) => e.bin === binomial(f.planta.nombreCientifico));
    if (excl) { excluidas++; console.log(`  ⊘ EXCLUIDA  ${etiqueta}  (${excl.motivo})`); continue; }
    if (f.valCientEspecialista) { ya++; console.log(`  = ya tenía  ${etiqueta}`); continue; }
    const pu = await repo.buscarPorId(f.id);
    if (!pu) throw new Error(`No se pudo cargar ${f.id}`);
    const evidencia = `${(f.motivoUso ?? '').trim()} Fuente citada: ${f.fuente.trim()}`;
    const enlace = primerEnlace(f.fuente);
    pu.registrarValidacionCientifica({ especialista: ESPECIALISTA, fecha, evidencia, enlace, registradaPorId: admin.id }); // lanza si la evidencia no cumple las reglas
    if (APLICAR) await repo.actualizar(pu);
    hechas++; console.log(`  ✔ ${APLICAR ? 'REGISTRADA' : 'registraría'}  ${etiqueta}  ${enlace ?? '(sin enlace)'}`);
  }
  console.log(`\n${APLICAR ? 'APLICADO' : 'SIMULACIÓN'}: validaciones ${APLICAR ? 'registradas' : 'a registrar'}: ${hechas} | ya tenían: ${ya} | excluidas: ${excluidas} | Científico total: ${filas.length}`);
})().catch((e) => { console.error(e.message); process.exit(1); }).finally(() => prisma.$disconnect());
