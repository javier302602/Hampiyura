import { PrismaClient } from '@prisma/client';
import { Pedido, PedidoProps } from '../../../../../../domain/entities/pedido.entity';
import { CobroProductoDatos, CobroProductoRepositoryPort, PedidoRepositoryPort } from '../../../../../../domain/ports/out/pedidos.ports';

// M-16: repositorios de cobro por producto y de pedidos.
export class PrismaCobroProductoRepository implements CobroProductoRepositoryPort {
  constructor(private readonly prisma: PrismaClient) {}
  async obtener(productoId: string): Promise<CobroProductoDatos | null> {
    const x = await this.prisma.cobroProducto.findUnique({ where: { productoId } });
    return x ? { productoId, yape: x.yape ?? undefined, plin: x.plin ?? undefined, cuenta: x.cuenta ?? undefined, entregaDias: x.entregaDias, compromisoEn: x.compromisoEn } : null;
  }
  async guardar(c: CobroProductoDatos): Promise<void> {
    const data = { yape: c.yape ?? null, plin: c.plin ?? null, cuenta: c.cuenta ?? null, entregaDias: c.entregaDias, compromisoEn: c.compromisoEn, actualizadoEn: new Date() };
    await this.prisma.cobroProducto.upsert({ where: { productoId: c.productoId }, create: { productoId: c.productoId, ...data }, update: data });
  }
}

export class PrismaPedidoRepository implements PedidoRepositoryPort {
  constructor(private readonly prisma: PrismaClient) {}
  private aDominio(x: any): Pedido {
    const eventos = (x.eventos as any[]).map((e) => ({ ...e, fecha: new Date(e.fecha) }));
    return new Pedido({
      ...x, cobro: x.cobro ?? {}, metodoElegido: x.metodoElegido ?? undefined, comprobanteUrl: x.comprobanteUrl ?? undefined, numeroOperacion: x.numeroOperacion ?? undefined,
      fechaLimiteEntrega: x.fechaLimiteEntrega ?? undefined, notaEnvio: x.notaEnvio ?? undefined, motivoRechazoPago: x.motivoRechazoPago ?? undefined,
      motivoReclamo: x.motivoReclamo ?? undefined, resolucion: x.resolucion ?? undefined, eventos,
    } as PedidoProps);
  }
  private datos(p: Pedido) {
    const { fechaLimiteEntrega, metodoElegido, comprobanteUrl, numeroOperacion, notaEnvio, motivoRechazoPago, motivoReclamo, resolucion, ...resto } = p.props;
    return { ...resto, fechaLimiteEntrega: fechaLimiteEntrega ?? null, metodoElegido: metodoElegido ?? null, comprobanteUrl: comprobanteUrl ?? null, numeroOperacion: numeroOperacion ?? null,
      notaEnvio: notaEnvio ?? null, motivoRechazoPago: motivoRechazoPago ?? null, motivoReclamo: motivoReclamo ?? null, resolucion: resolucion ?? null } as any;
  }
  async guardar(p: Pedido) { await this.prisma.pedido.create({ data: this.datos(p) }); }
  async actualizar(p: Pedido) { const { id, ...d } = this.datos(p); await this.prisma.pedido.update({ where: { id: p.props.id }, data: d }); }
  async buscarPorId(id: string) { const x = await this.prisma.pedido.findUnique({ where: { id } }); return x ? this.aDominio(x) : null; }
  async listarDe(usuarioId: string, rol: 'comprador' | 'vendedor') {
    return (await this.prisma.pedido.findMany({ where: rol === 'comprador' ? { compradorId: usuarioId } : { vendedorId: usuarioId }, orderBy: { creadoEn: 'desc' } })).map((x) => this.aDominio(x));
  }
  async listarPorEstado(estado: string) { return (await this.prisma.pedido.findMany({ where: { estado }, orderBy: { actualizadoEn: 'asc' } })).map((x) => this.aDominio(x)); }
}
