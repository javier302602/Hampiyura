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
import { UsoRepositoryPort } from '../../domain/ports/out/uso.repository.port';
import { esTipoProductor } from '../../domain/value-objects/tipo-productor.vo';
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
//
// Frente 3: además de plantasIds (legado, se sigue exigiendo/validando igual), acepta
// plantasUtilizadas (entrada estructurada) y aceptaComision. La comisión se exige UNA vez por
// usuario (Usuario.aceptoComisionEn), no por producto -- si ya aceptó antes, publicar de nuevo no
// vuelve a pedirlo; si es la primera vez, input.aceptaComision debe venir en true y acá se
// registra la fecha de aceptación en el perfil.
export class PublicarProductoUseCase implements PublicarProductoPort {
  constructor(private readonly repo:ProductoRepositoryPort, private readonly plantas:PlantaRepositoryPort, private readonly validaciones:ValidacionContenidoRepositoryPort, private readonly usuarios:UsuarioRepositoryPort, private readonly usos:UsoRepositoryPort) {}
  async ejecutar(input:PublicarProductoInput & { aceptaComision?: boolean }):Promise<Producto> {
    if (!input.nombre?.trim()) throw new ValidationError('El nombre del producto es obligatorio');
    if (!input.plantasIds?.length) throw new ValidationError('Debes indicar al menos una planta utilizada');
    if (!input.localidad?.trim()) throw new ValidationError('La localidad es obligatoria');
    if (!input.contactoVendedor?.trim()) throw new ValidationError('La forma de contacto es obligatoria');
    if (!input.informacionProceso?.trim()) throw new ValidationError('La descripción del proceso es obligatoria');
    if (!input.tipoProductor || !esTipoProductor(input.tipoProductor)) throw new ValidationError('Indica el tipo de productor: campesino, empresario o comunidad');
    const categoriasUso = [...new Set((input.categoriasUso ?? []).map((c) => c.trim()).filter(Boolean))];
    if (categoriasUso.length > 0) {
      // Mismo catálogo de usos/finalidades de M-04: no se mantiene una lista paralela de categorías.
      const catalogo = new Set((await this.usos.listar()).map((u) => u.props.nombre));
      const desconocida = categoriasUso.find((c) => !catalogo.has(c));
      if (desconocida) throw new ValidationError(`"${desconocida}" no está en el catálogo de usos`);
    }
    for (const plantaId of input.plantasIds) {
      if (!(await this.plantas.buscarPorId(plantaId))) throw new ValidationError(`La planta indicada no existe en el catálogo: ${plantaId}`);
    }
    const productor = await this.usuarios.buscarPorId(input.productorId);
    if (!productor) throw new NotFoundError(`Usuario no encontrado: ${input.productorId}`);
    if (!productor.props.aceptoComisionEn) {
      if (!input.aceptaComision) throw new ValidationError('Debes aceptar los términos de comisión (5% sobre ventas) antes de publicar');
      productor.props.aceptoComisionEn = new Date();
      await this.usuarios.actualizar(productor);
    }
    const requiereRevisionReforzada = contieneAfirmacionEnganosa(input.nombre, input.descripcion, input.informacionProceso, input.ingredientes, input.modoDeUso);
    const { aceptaComision: _omitir, ...productoInput } = input;
    // Texto vacío = no especificado: se guarda como ausente, nunca como relleno.
    const producto = new Producto({ ...productoInput, categoriasUso, modoDeUso: input.modoDeUso?.trim() || undefined, contraindicaciones: input.contraindicaciones?.trim() || undefined, id:randomUUID(), estadoValidacion:'Pendiente', requiereRevisionReforzada, etiquetaValidadoDocumental:false, etiquetaCertificado:false });
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
    return { requiereRevisionReforzada: contieneAfirmacionEnganosa(input.nombre, input.descripcion, input.informacionProceso, input.ingredientes, input.modoDeUso) };
  }
}
