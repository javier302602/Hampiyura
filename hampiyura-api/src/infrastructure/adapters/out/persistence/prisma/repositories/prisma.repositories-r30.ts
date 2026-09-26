import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import { AlertaDatos, AlertasRepositoryPort, BusquedasRepositoryPort, ConversacionDatos, DisponibilidadProductor, DisponibilidadRepositoryPort, MensajeDirectoDatos, MensajeriaRepositoryPort } from '../../../../../../domain/ports/out/mensajeria-alertas.ports';

// Ronda 30: repositorios de mensajería, alertas, disponibilidad de productores y búsquedas (M-15).
export class PrismaMensajeriaRepository implements MensajeriaRepositoryPort {
  constructor(private readonly prisma: PrismaClient) {}
  async buscarConversacion(compradorId: string, productorId: string): Promise<ConversacionDatos | null> {
    return this.prisma.conversacion.findUnique({ where: { compradorId_productorId: { compradorId, productorId } } });
  }
  async buscarConversacionPorId(id: string): Promise<ConversacionDatos | null> { return this.prisma.conversacion.findUnique({ where: { id } }); }
  async crearConversacion(c: ConversacionDatos): Promise<void> { await this.prisma.conversacion.create({ data: c }); }
  async listarConversacionesDe(usuarioId: string): Promise<ConversacionDatos[]> {
    return this.prisma.conversacion.findMany({ where: { OR: [{ compradorId: usuarioId }, { productorId: usuarioId }] }, orderBy: { actualizadaEn: 'desc' } });
  }
  async listarMensajes(conversacionId: string): Promise<MensajeDirectoDatos[]> {
    const xs = await this.prisma.mensajeDirecto.findMany({ where: { conversacionId }, orderBy: { creadoEn: 'asc' } });
    return xs.map((x) => ({ ...x, leidoEn: x.leidoEn ?? undefined }));
  }
  async guardarMensaje(m: MensajeDirectoDatos): Promise<void> {
    await this.prisma.mensajeDirecto.create({ data: { ...m, leidoEn: m.leidoEn ?? null } });
    await this.prisma.conversacion.update({ where: { id: m.conversacionId }, data: { actualizadaEn: m.creadoEn } });
  }
  async marcarLeidos(conversacionId: string, lectorId: string, ahora: Date): Promise<void> {
    await this.prisma.mensajeDirecto.updateMany({ where: { conversacionId, autorId: { not: lectorId }, leidoEn: null }, data: { leidoEn: ahora } });
  }
  async contarMensajesDesde(autorId: string, desde: Date): Promise<number> { return this.prisma.mensajeDirecto.count({ where: { autorId, creadoEn: { gte: desde } } }); }
}

export class PrismaAlertasRepository implements AlertasRepositoryPort {
  constructor(private readonly prisma: PrismaClient) {}
  private aDominio(x: { ultimaTemporada: string | null } & Omit<AlertaDatos, 'ultimaTemporada'>): AlertaDatos { return { ...x, ultimaTemporada: x.ultimaTemporada ?? undefined }; }
  async listarPorUsuario(usuarioId: string) { return (await this.prisma.alertaSeguimiento.findMany({ where: { usuarioId }, orderBy: { creadoEn: 'desc' } })).map((x) => this.aDominio(x)); }
  async listarTodas() { return (await this.prisma.alertaSeguimiento.findMany()).map((x) => this.aDominio(x)); }
  async buscar(usuarioId: string, plantaId: string) { const x = await this.prisma.alertaSeguimiento.findUnique({ where: { usuarioId_plantaId: { usuarioId, plantaId } } }); return x ? this.aDominio(x) : null; }
  async guardar(a: AlertaDatos) {
    const data = { disponibilidad: a.disponibilidad, temporada: a.temporada, productosNotificados: a.productosNotificados, ultimaTemporada: a.ultimaTemporada ?? null };
    await this.prisma.alertaSeguimiento.upsert({ where: { usuarioId_plantaId: { usuarioId: a.usuarioId, plantaId: a.plantaId } }, create: { id: a.id, usuarioId: a.usuarioId, plantaId: a.plantaId, creadoEn: a.creadoEn, ...data }, update: data });
  }
  async eliminar(usuarioId: string, plantaId: string) { await this.prisma.alertaSeguimiento.deleteMany({ where: { usuarioId, plantaId } }); }
}

export class PrismaDisponibilidadRepository implements DisponibilidadRepositoryPort {
  constructor(private readonly prisma: PrismaClient) {}
  async establecer(productorId: string, hasta: Date | null, nota?: string) { await this.prisma.usuario.update({ where: { id: productorId }, data: { disponibleHasta: hasta, disponibleNota: hasta ? (nota?.trim() || null) : null } }); }
  async listarVigentes(ahora: Date): Promise<DisponibilidadProductor[]> {
    const xs = await this.prisma.usuario.findMany({ where: { rol: 'Productor', estado: 'Activo', disponibleHasta: { gt: ahora } } });
    return xs.map((x) => ({ productorId: x.id, hasta: x.disponibleHasta!, nota: x.disponibleNota ?? undefined }));
  }
  async obtener(productorId: string): Promise<DisponibilidadProductor | null> {
    const x = await this.prisma.usuario.findUnique({ where: { id: productorId } });
    return x?.disponibleHasta ? { productorId, hasta: x.disponibleHasta, nota: x.disponibleNota ?? undefined } : null;
  }
}

export class PrismaBusquedasRepository implements BusquedasRepositoryPort {
  constructor(private readonly prisma: PrismaClient) {}
  async registrar(plantaIds: string[], fecha: Date) { if (plantaIds.length) await this.prisma.busquedaPlanta.createMany({ data: plantaIds.map((plantaId) => ({ id: randomUUID(), plantaId, fecha })) }); }
  async contarPorPlanta(desde?: Date) {
    const xs = await this.prisma.busquedaPlanta.groupBy({ by: ['plantaId'], _count: { _all: true }, where: desde ? { fecha: { gte: desde } } : undefined });
    return xs.map((x) => ({ plantaId: x.plantaId, cantidad: x._count._all })).sort((a, b) => b.cantidad - a.cantidad);
  }
}
