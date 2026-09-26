// Carga las plantas de los dos documentos del equipo (ver datos-plantas-documentos.ts) en la base REAL.
//   npx tsx scripts/cargar-plantas-documentos.ts            -> SIMULACIÓN: clasifica y muestra qué haría, sin escribir nada
//   npx tsx scripts/cargar-plantas-documentos.ts --aplicar  -> carga (idempotente: no duplica lo que ya existe)
// Como es información ya investigada y citada por el equipo (no una propuesta externa), se registra directamente como Validada, a nombre
// de una cuenta Administrador, con su registro de validación (fecha, validador y nota interna). Nada se completa con conocimiento general.
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import { Planta } from '../src/domain/entities/planta.entity';
import { ParteUso } from '../src/domain/entities/parte-uso.entity';
import { ValidacionContenido } from '../src/domain/entities/validacion-contenido.entity';
import { Fuente } from '../src/domain/value-objects/fuente.vo';
import { PrismaPlantaRepository, PrismaParteUsoRepository, PrismaUsoRepository, PrismaValidacionRepository } from '../src/infrastructure/adapters/out/persistence/prisma/repositories/prisma.repositories';
import { PLANTAS_DOCUMENTOS, PlantaDoc, EntradaUso } from './datos-plantas-documentos';

const APLICAR = process.argv.includes('--aplicar');
const prisma = new PrismaClient();
const binomial = (c: string) => c.replace(/\(.*?\)/g, '').split(/\s+/).filter((x) => x && x !== '×').slice(0, 2).join(' ');

type Estado = 'Ya agregada' | 'Pendiente (cargada)' | 'Pendiente (completada)';
(async () => {
  const admin = await prisma.usuario.findFirst({ where: { rol: 'Administrador', estado: 'Activo' }, orderBy: { correo: 'asc' } });
  if (!admin) throw new Error('No hay ninguna cuenta Administrador activa para registrar la carga.');
  const plantas = new PrismaPlantaRepository(prisma), partes = new PrismaParteUsoRepository(prisma), usos = new PrismaUsoRepository(prisma), validaciones = new PrismaValidacionRepository(prisma);
  const ahora = new Date();
  const filas: { doc: PlantaDoc; estado: Estado; id: string; nuevas: number; existentes: number; documentados: number }[] = [];

  for (const doc of PLANTAS_DOCUMENTOS) {
    // Clasificación: por nombre científico (género + especie) primero; por nombre común como respaldo.
    const bin = binomial(doc.nombreCientifico);
    const primerNombre = doc.nombreComun.split(/[ (]/)[0];
    // Comparación por género + especie normalizados (ignora autoría, paréntesis y el signo × de los híbridos).
    const todas = await prisma.planta.findMany();
    let existente = todas.find((x) => binomial(x.nombreCientifico) === bin) ?? null;
    if (!existente) existente = await prisma.planta.findFirst({ where: { nombreComun: { equals: primerNombre, mode: 'insensitive' } } });
    const plantaId = existente?.id ?? randomUUID();
    const previos = existente ? await prisma.parteUso.findMany({ where: { plantaId } }) : [];
    let existentes = 0;
    const porCrear: { e: EntradaUso; usoId: string }[] = [];
    for (const e of doc.usos) {
      const uso = await usos.buscarPorNombre(e.uso);
      if (!uso) throw new Error(`El uso "${e.uso}" no está en el catálogo (planta ${doc.nombreCientifico})`);
      const ya = previos.some((p) => p.usoId === uso.props.id && p.parte === e.parte && (p.parteDetalle ?? '') === (e.parteDetalle ?? '') && p.tipoConocimiento === e.tipo);
      if (ya) existentes++; else porCrear.push({ e, usoId: uso.props.id });
    }
    const nuevas = porCrear.length;
    const estado: Estado = !existente ? 'Pendiente (cargada)' : nuevas === 0 ? 'Ya agregada' : 'Pendiente (completada)';
    if (APLICAR && (!existente || nuevas > 0)) {
      if (!existente) {
        await plantas.guardar(new Planta({ id: plantaId, nombreComun: doc.nombreComun, nombreCientifico: doc.nombreCientifico, familia: doc.familia, region: doc.region, habitat: doc.habitat, estadoValidacion: 'Validado' }));
        await validaciones.guardar(new ValidacionContenido({ id: randomUUID(), tipoEntidad: 'Planta', entidadId: plantaId, estado: 'Validado', fecha: ahora, autorId: admin.id, validadorId: admin.id, comentarioValidador: 'Carga de los documentos de plantas medicinales del equipo (Ronda 28): datos tomados solo de los documentos, con fuentes citadas.' }));
      }
      for (const { e, usoId } of porCrear) {
        const pu = new ParteUso({ id: randomUUID(), plantaId, autorId: admin.id, parte: e.parte, parteDetalle: e.parteDetalle, usoId, tipoConocimiento: e.tipo, motivoUso: e.motivo, fuente: new Fuente(e.fuente), contraindicaciones: e.contraindicaciones, estadoValidacion: 'Validado' });
        await partes.guardar(pu);
        await validaciones.guardar(new ValidacionContenido({ id: randomUUID(), tipoEntidad: 'ParteUso', entidadId: pu.props.id, estado: 'Validado', fecha: ahora, autorId: admin.id, validadorId: admin.id,
          comentarioValidador: e.notaInterna ? `Carga de documentos (Ronda 28). PENDIENTE DE CONFIRMAR: ${e.notaInterna}` : 'Carga de documentos (Ronda 28).' }));
      }
    }
    filas.push({ doc, estado, id: existente || APLICAR ? plantaId : '(se creará)', nuevas, existentes, documentados: doc.usos.filter((u) => u.tipo === 'Documentado').length });
  }

  console.log(`\n${APLICAR ? 'CARGA APLICADA' : 'SIMULACIÓN (no se escribió nada)'} — registrada a nombre de ${admin.correo}\n`);
  console.log('Planta'.padEnd(52), 'Estado'.padEnd(24), 'Nuevas'.padEnd(7), 'Ya en BD'.padEnd(9), 'Documentado'.padEnd(12), 'ID');
  for (const f of filas) console.log(f.doc.nombreCientifico.slice(0, 50).padEnd(52), f.estado.padEnd(24), String(f.nuevas).padEnd(7), String(f.existentes).padEnd(9), String(f.documentados).padEnd(12), f.id);
  const total = (k: Estado) => filas.filter((f) => f.estado === k).length;
  console.log(`\nYa agregada: ${total('Ya agregada')} | Pendiente (cargada): ${total('Pendiente (cargada)')} | Pendiente (completada): ${total('Pendiente (completada)')} | En observación (con algún uso Documentado): ${filas.filter((f) => f.documentados > 0).length}`);
  console.log(`Combinaciones Parte+Uso: nuevas ${filas.reduce((a, f) => a + f.nuevas, 0)}, ya existentes ${filas.reduce((a, f) => a + f.existentes, 0)} (de las cuales Documentado en total: ${filas.reduce((a, f) => a + f.documentados, 0)})`);
})().catch((e) => { console.error(e.message); process.exit(1); }).finally(() => prisma.$disconnect());
