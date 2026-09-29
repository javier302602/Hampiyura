import { PrismaClient } from '@prisma/client';
import { ContratoCultivo, ContratoCultivoProps } from '../../../../../../domain/entities/contrato-cultivo.entity';
import { ContratoCultivoRepositoryPort } from '../../../../../../domain/ports/out/contrato-cultivo.repository.port';

// M-17: contratos de compra directa de cosecha.
export class PrismaContratoCultivoRepository implements ContratoCultivoRepositoryPort {
  constructor(private readonly prisma: PrismaClient) {}
  private aDominio(x: any): ContratoCultivo {
    const eventos = (x.eventos as any[]).map((e) => ({ ...e, fecha: new Date(e.fecha) }));
    return new ContratoCultivo({
      ...x, mensajeComprador: x.mensajeComprador ?? undefined, cobroMedio: x.cobroMedio ?? undefined, cobroNumero: x.cobroNumero ?? undefined,
      comprobanteAdelantoUrl: x.comprobanteAdelantoUrl ?? undefined, numeroOperacionAdelanto: x.numeroOperacionAdelanto ?? undefined,
      motivoRechazo: x.motivoRechazo ?? undefined, motivoRechazoAdelanto: x.motivoRechazoAdelanto ?? undefined, eventos,
    } as ContratoCultivoProps);
  }
  private datos(c: ContratoCultivo) {
    const { mensajeComprador, cobroMedio, cobroNumero, comprobanteAdelantoUrl, numeroOperacionAdelanto, motivoRechazo, motivoRechazoAdelanto, ...resto } = c.props;
    return {
      ...resto, mensajeComprador: mensajeComprador ?? null, cobroMedio: cobroMedio ?? null, cobroNumero: cobroNumero ?? null,
      comprobanteAdelantoUrl: comprobanteAdelantoUrl ?? null, numeroOperacionAdelanto: numeroOperacionAdelanto ?? null,
      motivoRechazo: motivoRechazo ?? null, motivoRechazoAdelanto: motivoRechazoAdelanto ?? null,
    } as any;
  }
  async guardar(c: ContratoCultivo) { await this.prisma.contratoCultivo.create({ data: this.datos(c) }); }
  async actualizar(c: ContratoCultivo) { const { id, ...d } = this.datos(c); await this.prisma.contratoCultivo.update({ where: { id: c.props.id }, data: d }); }
  async buscarPorId(id: string) { const x = await this.prisma.contratoCultivo.findUnique({ where: { id } }); return x ? this.aDominio(x) : null; }
  async listarDe(usuarioId: string, rol: 'comprador' | 'agricultor') {
    return (await this.prisma.contratoCultivo.findMany({ where: rol === 'comprador' ? { compradorId: usuarioId } : { agricultorId: usuarioId }, orderBy: { creadoEn: 'desc' } })).map((x) => this.aDominio(x));
  }
}
