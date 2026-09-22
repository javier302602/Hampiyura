import { randomUUID } from 'crypto';
import { Producto } from '../../domain/entities/producto.entity';
import { ValidacionContenido } from '../../domain/entities/validacion-contenido.entity';
import { PublicarProductoInput, PublicarProductoPort } from '../../domain/ports/in/m11-productos/publicar-producto.port';
import { ObtenerProductoPort, ProductoVisible } from '../../domain/ports/in/m11-productos/obtener-producto.port';
import { ListarProductosPort, FiltrosProductos } from '../../domain/ports/in/m11-productos/listar-productos.port';
import { MarcarValidadoDocumentalmentePort } from '../../domain/ports/in/m11-productos/marcar-validado-documentalmente.port';
import { MarcarCertificadoPort } from '../../domain/ports/in/m11-productos/marcar-certificado.port';
import { VerificarAfirmacionesInput, VerificarAfirmacionesPort } from '../../domain/ports/in/m11-productos/verificar-afirmaciones.port';
import { ProductoRepositoryPort } from '../../domain/ports/out/producto.repository.port';
import { PlantaRepositoryPort } from '../../domain/ports/out/planta.repository.port';
import { UsuarioRepositoryPort } from '../../domain/ports/out/usuario.repository.port';
import { ValidacionContenidoRepositoryPort } from '../../domain/ports/out/validacion-contenido.repository.port';
import { contieneAfirmacionEnganosa } from '../../domain/value-objects/afirmaciones-enganosas.vo';
import { NotFoundError, ValidationError } from '../../domain/errors/domain.errors';

async function aVista(producto:Producto, plantas:PlantaRepositoryPort, usuarios:UsuarioRepositoryPort):Promise<ProductoVisible> {
  const plantasNombres = await Promise.all(producto.props.plantasIds.map(async (id) => (await plantas.buscarPorId(id))?.props.nombreComun ?? id));
  const productor = await usuarios.buscarPorId(producto.props.productorId);
  return { ...producto.props, revisadoPorEquipo:producto.revisadoPorEquipo(), plantasNombres, productorNombre: productor?.props.nombre ?? producto.props.productorId };
}

// RF-272/273: obligatorios = nombre, plantasIds, productorId, localidad, contactoVendedor,
// informacionProceso. RF-274: se escanean los campos de texto ANTES de entrar a revisión (M-09);
// si hay afirmaciones engañosas, el producto igual se crea pero queda marcado para revisión
// reforzada -- no se bloquea la creación, se refuerza el control humano (ver resumen de la sesión).
export class PublicarProductoUseCase implements PublicarProductoPort {
  constructor(private readonly repo:ProductoRepositoryPort, private readonly plantas:PlantaRepositoryPort, private readonly validaciones:ValidacionContenidoRepositoryPort) {}
  async ejecutar(input:PublicarProductoInput):Promise<Producto> {
    if (!input.nombre?.trim()) throw new ValidationError('El nombre del producto es obligatorio');
    if (!input.plantasIds?.length) throw new ValidationError('Debes indicar al menos una planta utilizada');
    if (!input.localidad?.trim()) throw new ValidationError('La localidad es obligatoria');
    if (!input.contactoVendedor?.trim()) throw new ValidationError('La forma de contacto es obligatoria');
    if (!input.informacionProceso?.trim()) throw new ValidationError('La descripción del proceso es obligatoria');
    for (const plantaId of input.plantasIds) {
      if (!(await this.plantas.buscarPorId(plantaId))) throw new ValidationError(`La planta indicada no existe en el catálogo: ${plantaId}`);
    }
    const requiereRevisionReforzada = contieneAfirmacionEnganosa(input.nombre, input.descripcion, input.informacionProceso, input.ingredientes);
    const producto = new Producto({ ...input, id:randomUUID(), estadoValidacion:'Pendiente', requiereRevisionReforzada, etiquetaValidadoDocumental:false, etiquetaCertificado:false });
    await this.repo.guardar(producto);
    await this.validaciones.guardar(new ValidacionContenido({ id:randomUUID(), tipoEntidad:'Producto', entidadId:producto.props.id, estado:'Pendiente', fecha:new Date(), autorId:producto.props.productorId }));
    return producto;
  }
}
export class ObtenerProductoUseCase implements ObtenerProductoPort {
  constructor(private readonly repo:ProductoRepositoryPort, private readonly plantas:PlantaRepositoryPort, private readonly usuarios:UsuarioRepositoryPort) {}
  async ejecutar(id:string):Promise<ProductoVisible> {
    const producto = await this.repo.buscarPorId(id);
    if (!producto || !producto.esVisiblePublicamente()) throw new NotFoundError(`Producto no encontrado: ${id}`);
    return aVista(producto, this.plantas, this.usuarios);
  }
}
export class ListarProductosUseCase implements ListarProductosPort {
  constructor(private readonly repo:ProductoRepositoryPort, private readonly plantas:PlantaRepositoryPort, private readonly usuarios:UsuarioRepositoryPort) {}
  async ejecutar(filtros:FiltrosProductos={}):Promise<ProductoVisible[]> {
    const todos = await this.repo.listar();
    const visibles = todos.filter(p=>p.esVisiblePublicamente()
      && (!filtros.localidad || p.props.localidad===filtros.localidad)
      && (!filtros.plantaId || p.props.plantasIds.includes(filtros.plantaId)));
    return Promise.all(visibles.map(p=>aVista(p, this.plantas, this.usuarios)));
  }
}
export class MarcarValidadoDocumentalmenteUseCase implements MarcarValidadoDocumentalmentePort {
  constructor(private readonly repo:ProductoRepositoryPort) {}
  async ejecutar(id:string):Promise<Producto> {
    const producto = await this.repo.buscarPorId(id);
    if (!producto) throw new NotFoundError(`Producto no encontrado: ${id}`);
    producto.marcarValidadoDocumentalmente();
    await this.repo.actualizar(producto);
    return producto;
  }
}
export class MarcarCertificadoUseCase implements MarcarCertificadoPort {
  constructor(private readonly repo:ProductoRepositoryPort) {}
  async ejecutar(id:string, documentacion:string):Promise<Producto> {
    const producto = await this.repo.buscarPorId(id);
    if (!producto) throw new NotFoundError(`Producto no encontrado: ${id}`);
    producto.marcarCertificado(documentacion);
    await this.repo.actualizar(producto);
    return producto;
  }
}
export class VerificarAfirmacionesUseCase implements VerificarAfirmacionesPort {
  async ejecutar(input:VerificarAfirmacionesInput):Promise<{ requiereRevisionReforzada: boolean }> {
    return { requiereRevisionReforzada: contieneAfirmacionEnganosa(input.nombre, input.descripcion, input.informacionProceso, input.ingredientes) };
  }
}
