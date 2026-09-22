import { randomUUID } from 'crypto';
import { Reporte } from '../../domain/entities/reporte.entity';
import { ReportarContenidoInput, ReportarContenidoPort } from '../../domain/ports/in/m09-validacion/reportar-contenido.port';
import { ListarReportesPendientesPort } from '../../domain/ports/in/m09-validacion/listar-reportes-pendientes.port';
import { ActualizarEstadoReportePort, AccionReporte } from '../../domain/ports/in/m09-validacion/actualizar-estado-reporte.port';
import { ReporteRepositoryPort } from '../../domain/ports/out/reporte.repository.port';
import { NotFoundError, ValidationError } from '../../domain/errors/domain.errors';

// RF-25/26: cualquier usuario autenticado puede reportar un ítem YA publicado (planta, ficha
// de cultivo, parte+uso...) indicando un motivo. No valida que entidadId exista de verdad
// (mantenerlo simple para esta fase); ver decisiones en el resumen de la sesión.
export class ReportarContenidoUseCase implements ReportarContenidoPort {
  constructor(private readonly repo:ReporteRepositoryPort) {}
  async ejecutar(input:ReportarContenidoInput):Promise<Reporte> {
    if (!input.motivo?.trim()) throw new ValidationError('El motivo del reporte es obligatorio');
    if (!input.tipoEntidad?.trim() || !input.entidadId?.trim()) throw new ValidationError('El reporte debe indicar qué contenido se está reportando');
    const reporte = new Reporte({ ...input, id:randomUUID(), fecha:new Date(), estado:'Pendiente' });
    await this.repo.guardar(reporte);
    return reporte;
  }
}
export class ListarReportesPendientesUseCase implements ListarReportesPendientesPort {
  constructor(private readonly repo:ReporteRepositoryPort) {}
  async ejecutar():Promise<Reporte[]> { return this.repo.listarPendientes(); }
}
export class ActualizarEstadoReporteUseCase implements ActualizarEstadoReportePort {
  constructor(private readonly repo:ReporteRepositoryPort) {}
  async ejecutar(id:string, accion:AccionReporte):Promise<Reporte> {
    const reporte = await this.repo.buscarPorId(id);
    if (!reporte) throw new NotFoundError(`Reporte no encontrado: ${id}`);
    if (accion === 'Revisado') reporte.marcarRevisado(); else reporte.marcarDesestimado();
    await this.repo.actualizar(reporte);
    return reporte;
  }
}
