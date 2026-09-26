// Ronda 29: completa las 27 plantas cargadas en la Ronda 28 con foto (+ atribución), hábitat/distribución y preparaciones.
//   npx tsx scripts/cargar-fichas-plantas.ts            -> SIMULACIÓN: muestra qué haría, sin escribir nada
//   npx tsx scripts/cargar-fichas-plantas.ts --aplicar  -> aplica (idempotente: no duplica preparaciones ni pisa otra foto)
// Los datos salen de datos-fichas-plantas.ts (a su vez, del documento Fichas_Habitat_Foto_Preparacion.md). Nada se completa con
// conocimiento general: los campos sin dato en la fuente quedan vacíos. Las preparaciones se registran como Validadas a nombre de una
// cuenta Administrador, con su registro de validación, igual que las combinaciones Parte+Uso de la Ronda 28.
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import { FICHAS_PLANTAS, DISTRIBUCION_NATURAL } from './datos-fichas-plantas';

const APLICAR = process.argv.includes('--aplicar');
const prisma = new PrismaClient();
const binomial = (c: string) => c.replace(/\(.*?\)/g, '').split(/\s+/).filter((x) => x && x !== '×').slice(0, 2).join(' ');

(async () => {
  const admin = await prisma.usuario.findFirst({ where: { rol: 'Administrador', estado: 'Activo' }, orderBy: { correo: 'asc' } });
  if (!admin) throw new Error('No hay ninguna cuenta Administrador activa para registrar la carga.');
  const todas = await prisma.planta.findMany();
  const usos = await prisma.uso.findMany();
  const ahora = new Date();
  let fotos = 0, habitats = 0, prepsNuevas = 0, prepsYa = 0, sinFila = 0;
  const filas: string[] = [];

  for (const f of FICHAS_PLANTAS) {
    const planta = todas.find((x) => binomial(x.nombreCientifico) === f.bin);
    if (!planta) { console.log(`✗ No está en la BD: ${f.bin}`); continue; }

    const datos: Record<string, any> = {};
    const dist = DISTRIBUCION_NATURAL[f.bin];
    if (dist && JSON.stringify(planta.distribucionNatural) !== JSON.stringify(dist)) datos.distribucionNatural = dist;
    if (planta.habitat !== f.habitat) { datos.habitat = f.habitat; habitats++; }
    if (f.foto && planta.imagenPrincipal !== f.foto.url) {
      Object.assign(datos, { imagenPrincipal: f.foto.url, imagenAutor: f.foto.autor, imagenLicencia: f.foto.licencia, imagenFuenteUrl: f.foto.fuenteUrl }); fotos++;
    }
    if (APLICAR && Object.keys(datos).length) await prisma.planta.update({ where: { id: planta.id }, data: datos });

    const partes = await prisma.parteUso.findMany({ where: { plantaId: planta.id, tipoConocimiento: 'Tradicional' } });
    let nuevasPlanta = 0;
    for (const pr of f.preparaciones) {
      const uso = usos.find((u) => u.nombre === pr.uso);
      const pu = partes.find((p) => p.usoId === uso?.id && p.parte === pr.parte && (p.parteDetalle ?? '') === (pr.parteDetalle ?? ''));
      if (!pu) { sinFila++; console.log(`✗ Sin fila Parte+Uso Tradicional para ${f.bin}: ${pr.parte} / ${pr.parteDetalle ?? ''} / ${pr.uso}`); continue; }
      const ya = await prisma.preparacion.findFirst({ where: { parteUsoId: pu.id } });
      if (ya) { prepsYa++; continue; }
      nuevasPlanta++; prepsNuevas++;
      if (!APLICAR) continue;
      const id = randomUUID();
      await prisma.preparacion.create({ data: {
        id, parteUsoId: pu.id, autorId: admin.id,
        ingredientes: '', pasos: pr.pasos ?? '', herramientas: '', tiempoPreparacion: '', // sin dato en la fuente: vacío, no se inventa
        formaTradicionalElaboracion: pr.formaTradicionalElaboracion, formaConservacion: '',
        advertencias: pr.advertencias ?? '', contraindicaciones: pu.contraindicaciones ?? undefined, // solo lo que la fuente ya declaró para ese uso
        fuente: pu.fuente, localidad: pr.localidad, fecha: ahora, estadoValidacion: 'Validado',
      } });
      await prisma.validacionContenido.create({ data: { id: randomUUID(), tipoEntidad: 'Preparacion', entidadId: id, estado: 'Validado', fecha: ahora, autorId: admin.id, validadorId: admin.id,
        comentarioValidador: 'Carga de documentos (Ronda 29): texto de "Preparación" del documento de uso tradicional; campos sin dato en la fuente quedan vacíos.' } });
    }
    filas.push(`${f.bin.padEnd(28)} foto:${f.foto ? 'sí' : 'NO'}  hábitat:sí  preparaciones nuevas:${nuevasPlanta}`);
  }
  console.log(`\n${APLICAR ? 'CARGA APLICADA' : 'SIMULACIÓN (no se escribió nada)'} — a nombre de ${admin.correo}\n`);
  filas.forEach((l) => console.log(l));
  console.log(`\nFotos a cargar/cargadas: ${fotos} | Hábitats: ${habitats} | Preparaciones nuevas: ${prepsNuevas} (ya existían: ${prepsYa}) | Preparaciones sin fila Parte+Uso: ${sinFila}`);
})().catch((e) => { console.error(e.message); process.exit(1); }).finally(() => prisma.$disconnect());
