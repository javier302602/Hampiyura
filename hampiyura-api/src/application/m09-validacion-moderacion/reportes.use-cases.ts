import { randomUUID } from 'crypto';
import { Reporte } from '../../domain/entities/reporte.entity';
import { ReportarContenidoInput, ReportarContenidoPort } from '../../domain/ports/in/m09-validacion/reportar-contenido.port';
import { ListarReportesPendientesPort } from '../../domain/ports/in/m09-validacion/listar-reportes-pendientes.port';
import { ActualizarEstadoReportePort, AccionReporte } from '../../domain/ports/in/m09-validacion/actualizar-estado-reporte.port';
import { ListarReportesPort, ReporteVisible } from '../../domain/ports/in/m09-validacion/listar-reportes.port';
import { EstadoReporte } from '../../domain/value-objects/estado-reporte.vo';
import { ComentarioRepositoryPort } from '../../domain/ports/out/comentario.repository.port';
import { UsuarioRepositoryPort } from '../../domain/ports/out/usuario.repository.port';
import { ReporteRepositoryPort } from '../../domain/ports/out/reporte.repository.port';
import { esCategoriaReporte } from '../../domain/value-objects/categoria-reporte.vo';
import { NotFoundError, ValidationError } from '../../domain/errors/domain.errors';

// RF-25/26: cualquier usuario autenticado puede reportar un ítem YA publicado (planta, ficha
// de cultivo, parte+uso...) indicando un motivo. No valida que entidadId exista de verdad
// (mantenerlo simple para esta fase); ver decisiones en el resumen de la sesión.
export class ReportarContenidoUseCase implements ReportarContenidoPort {
  constructor(private readonly repo:ReporteRepositoryPort) {}
  async ejecutar(input:ReportarContenidoInput):Promise<Reporte> {
    // Sin categoría (clientes anteriores) equivale a "Otro". La descripción solo es obligatoria en "Otro".
    const categoria = input.categoria ?? 'Otro';
    if (!esCategoriaReporte(categoria)) throw new ValidationError('Elige una categoría de motivo válida');
    const descripcion = input.motivo?.trim() ?? '';
    if (categoria === 'Otro' && !descripcion) throw new ValidationError('Describe el motivo del reporte');
    if (!input.tipoEntidad?.trim() || !input.entidadId?.trim()) throw new ValidationError('El reporte debe indicar qué contenido se está reportando');
    const reporte = new Reporte({ ...input, categoria, motivo:descripcion, id:randomUUID(), fecha:new Date(), estado:'Pendiente' });
    await this.repo.guardar(reporte);
    return reporte;
  }
}
export class ListarReportesPendientesUseCase implements ListarReportesPendientesPort {
  constructor(private readonly repo:ReporteRepositoryPort) {}
  async ejecutar():Promise<Reporte[]> { return this.repo.listarPendientes(); }
}
// Bandeja de reportes: además del reporte crudo resuelve quién reportó y, para comentarios (el único
// tipo que hoy se puede reportar desde la interfaz), el texto y la publicación donde está -- sin
// eso el validador solo vería un UUID.
export class ListarReportesUseCase implements ListarReportesPort {
  constructor(private readonly repo:ReporteRepositoryPort, private readonly usuarios:UsuarioRepositoryPort, private readonly comentarios:ComentarioRepositoryPort) {}
  async ejecutar(estado?:EstadoReporte):Promise<ReporteVisible[]> {
    const reportes = await this.repo.listarPorEstado(estado);
    const resultado:ReporteVisible[] = [];
    for (const r of reportes) {
      const autor = await this.usuarios.buscarPorId(r.props.autorId);
      const comentario = r.props.tipoEntidad === 'Comentario' ? await this.comentarios.buscarPorId(r.props.entidadId) : null;
      const autorContenido = comentario ? await this.usuarios.buscarPorId(comentario.props.autorId) : null;
      resultado.push({
        ...r.props,
        reportadoPor: autor?.props.nombre ?? r.props.autorId,
        contenido: comentario ? { texto: comentario.props.texto, publicacionId: comentario.props.publicacionId, autorNombre: autorContenido?.props.nombre ?? comentario.props.autorId } : null,
      });
    }
    return resultado;
  }
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
