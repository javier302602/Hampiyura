import { ObtenerDetalleValidacionPort, DetalleValidacion, CampoDetalle } from '../../domain/ports/in/m09-validacion/obtener-detalle-validacion.port';
import { ValidacionContenidoRepositoryPort } from '../../domain/ports/out/validacion-contenido.repository.port';
import { PublicacionRepositoryPort } from '../../domain/ports/out/publicacion.repository.port';
import { PreparacionRepositoryPort } from '../../domain/ports/out/preparacion.repository.port';
import { ParteUsoRepositoryPort } from '../../domain/ports/out/parte-uso.repository.port';
import { ProductoRepositoryPort } from '../../domain/ports/out/producto.repository.port';
import { EstadoConservacionRepositoryPort } from '../../domain/ports/out/estado-conservacion.repository.port';
import { PlantaRepositoryPort } from '../../domain/ports/out/planta.repository.port';
import { CultivoRepositoryPort } from '../../domain/ports/out/cultivo.repository.port';
import { UsuarioRepositoryPort } from '../../domain/ports/out/usuario.repository.port';
import { UsoRepositoryPort } from '../../domain/ports/out/uso.repository.port';
import { SolicitudCuentaRepositoryPort } from '../../domain/ports/out/solicitud-cuenta.repository.port';
import { ETIQUETA_TIPO_CUENTA } from '../../domain/value-objects/tipo-cuenta.vo';
import { CATALOGO_PLANES } from '../../domain/value-objects/plan.vo';
import { PLAN_POR_TIPO_CUENTA } from '../../domain/value-objects/tipo-cuenta.vo';
import { NotFoundError } from '../../domain/errors/domain.errors';
import { ParteUso } from '../../domain/entities/parte-uso.entity';

const NO_INFORMADO = 'No informado';
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function campo(etiqueta: string, valor: unknown): CampoDetalle | null {
  if (valor === undefined || valor === null) return null;
  const texto = valor instanceof Date ? valor.toLocaleDateString('es-PE') : typeof valor === 'boolean' ? (valor ? 'Sí' : 'No') : Array.isArray(valor) ? valor.join(', ') : String(valor);
  return { etiqueta, valor: texto.trim() ? texto : NO_INFORMADO };
}
function limpiar(campos: (CampoDetalle | null)[]): CampoDetalle[] { return campos.filter((c): c is CampoDetalle => c !== null); }

// Detalle completo para la bandeja de M-09: resuelve, según tipoEntidad, todos los campos que envió quien
// propuso el contenido. Usa los mismos repositorios que ListarPendientesUseCase (buscarPorId no filtra por
// visibilidad, así que sirve para contenido Pendiente).
export class ObtenerDetalleValidacionUseCase implements ObtenerDetalleValidacionPort {
  constructor(
    private readonly validaciones: ValidacionContenidoRepositoryPort,
    private readonly usuarios: UsuarioRepositoryPort,
    private readonly plantas: PlantaRepositoryPort,
    private readonly partesUso: ParteUsoRepositoryPort,
    private readonly usos: UsoRepositoryPort,
    private readonly publicaciones: PublicacionRepositoryPort,
    private readonly preparaciones: PreparacionRepositoryPort,
    private readonly productos: ProductoRepositoryPort,
    private readonly estadosConservacion: EstadoConservacionRepositoryPort,
    private readonly cultivos: CultivoRepositoryPort,
    private readonly solicitudesCuenta?: SolicitudCuentaRepositoryPort,
  ) {}

  async ejecutar(validacionId: string): Promise<DetalleValidacion> {
    const v = await this.validaciones.buscarPorId(validacionId);
    if (!v) throw new NotFoundError(`Validación no encontrada: ${validacionId}`);
    const autor = await this.usuarios.buscarPorId(v.props.autorId);
    const base: DetalleValidacion = {
      id: v.props.id, tipoEntidad: v.props.tipoEntidad, estado: v.props.estado, fecha: v.props.fecha,
      autorNombre: autor?.props.nombre ?? v.props.autorId, etiqueta: v.props.tipoEntidad,
      campos: [], imagenes: [], ubicacion: null, relacionados: [],
    };
    const e = v.props.entidadId;

    if (v.props.tipoEntidad === 'Planta') {
      const p = await this.plantas.buscarPorId(e);
      if (!p) return this.noDisponible(base);
      const partes = (await this.partesUso.listarPorPlanta(e)).filter((x) => x.props.autorId === v.props.autorId);
      return {
        ...base, etiqueta: `${p.props.nombreComun} (${p.props.nombreCientifico})`,
        campos: limpiar([campo('Nombre común', p.props.nombreComun), campo('Nombre científico', p.props.nombreCientifico), campo('Familia botánica', p.props.familia), campo('Región / área de crecimiento', p.props.region), campo('Hábitat', p.props.habitat)]),
        imagenes: p.props.imagenPrincipal ? [p.props.imagenPrincipal] : [],
        ubicacion: p.props.latitud != null && p.props.longitud != null ? { latitud: p.props.latitud, longitud: p.props.longitud } : null,
        relacionados: await Promise.all(partes.map((x) => this.relacionadoParteUso(x))),
      };
    }
    if (v.props.tipoEntidad === 'ParteUso') {
      const x = await this.partesUso.buscarPorId(e);
      if (!x) return this.noDisponible(base);
      const planta = await this.plantas.buscarPorId(x.props.plantaId);
      const r = await this.relacionadoParteUso(x);
      const parte = x.props.parte === 'Otra' && x.props.parteDetalle ? x.props.parteDetalle : x.props.parte;
      return { ...base, etiqueta: `${parte} de ${planta?.props.nombreComun ?? x.props.plantaId}`, campos: limpiar([campo('Planta', planta?.props.nombreComun ?? x.props.plantaId), ...r.campos]) };
    }
    if (v.props.tipoEntidad === 'Publicacion') {
      const p = await this.publicaciones.buscarPorId(e);
      if (!p) return this.noDisponible(base);
      const planta = await this.plantas.buscarPorId(p.props.plantaId);
      return { ...base, etiqueta: p.props.nombreComun, imagenes: p.props.imagenes, campos: limpiar([campo('Título / nombre común', p.props.nombreComun), campo('Planta del catálogo', planta?.props.nombreComun), campo('Descripción', p.props.descripcion), campo('Enfermedades que trata', p.props.enfermedadesTratadas), campo('Forma de preparación', p.props.formaPreparacion), campo('Tipo de conocimiento', p.props.tipoConocimiento), campo('Fuente', p.props.fuente.valor), campo('Fecha', p.props.fechaPublicacion)]) };
    }
    if (v.props.tipoEntidad === 'Preparacion') {
      const p = await this.preparaciones.buscarPorId(e);
      if (!p) return this.noDisponible(base);
      const pu = await this.partesUso.buscarPorId(p.props.parteUsoId);
      const planta = pu ? await this.plantas.buscarPorId(pu.props.plantaId) : null;
      return { ...base, etiqueta: `Preparación${pu ? ` de ${pu.props.parte}` : ''}`, campos: limpiar([campo('Planta', planta?.props.nombreComun), campo('Parte utilizada', pu?.props.parte), campo('Ingredientes', p.props.ingredientes), campo('Pasos', p.props.pasos), campo('Herramientas', p.props.herramientas), campo('Tiempo de preparación', p.props.tiempoPreparacion), campo('Forma tradicional de elaboración', p.props.formaTradicionalElaboracion), campo('Forma de conservación', p.props.formaConservacion), campo('Advertencias', p.props.advertencias), campo('Contraindicaciones (según la fuente)', p.props.contraindicaciones), campo('Fuente', p.props.fuente.valor), campo('Localidad', p.props.localidad)]) };
    }
    if (v.props.tipoEntidad === 'Producto') {
      const p = await this.productos.buscarPorId(e);
      if (!p) return this.noDisponible(base);
      const usadas = (p.props.plantasUtilizadas ?? []).map((u) => `${u.plantaNombreLibre} (${u.parteUsada}, ${u.estado}${u.cantidad ? `, ${u.cantidad}` : ''})`);
      return { ...base, etiqueta: p.props.nombre, imagenes: p.props.fotografias, ubicacion: p.props.latitud != null && p.props.longitud != null ? { latitud: p.props.latitud, longitud: p.props.longitud } : null, campos: limpiar([campo('Nombre', p.props.nombre), campo('Descripción', p.props.descripcion), campo('Plantas utilizadas', usadas), campo('Ingredientes', p.props.ingredientes), campo('Presentación', p.props.presentacion), campo('Cantidad disponible', p.props.cantidad), campo('Precio referencial', p.props.precioReferencial), campo('Localidad', p.props.localidad), campo('Información del proceso', p.props.informacionProceso), campo('Fecha de elaboración', p.props.fechaElaboracion), campo('Contacto del vendedor', p.props.contactoVendedor), campo('Documentación / certificación', p.props.documentacionCertificacion), campo('Requiere revisión reforzada (afirmaciones sensibles)', p.props.requiereRevisionReforzada)]) };
    }
    if (v.props.tipoEntidad === 'EstadoConservacion') {
      const s = await this.estadosConservacion.buscarPorId(e);
      if (!s) return this.noDisponible(base);
      const planta = await this.plantas.buscarPorId(s.props.plantaId);
      return { ...base, etiqueta: `Conservación de ${planta?.props.nombreComun ?? s.props.plantaId}`, campos: limpiar([campo('Planta', planta?.props.nombreComun), campo('Categoría (según la fuente)', s.props.categoria), campo('Nivel de riesgo', s.props.nivelRiesgo), campo('Zona (general)', s.props.zona), campo('Amenazas', s.props.amenazas), campo('Disponibilidad por temporada', s.props.disponibilidadTemporada), campo('Recomendaciones de conservación', s.props.recomendacionesConservacion), campo('Métodos de propagación', s.props.metodosPropagacion), campo('Alternativas de cultivo', s.props.alternativasCultivo), campo('Fuente oficial', s.props.fuenteOficial.valor)]) };
    }
    if (v.props.tipoEntidad === 'SolicitudCuenta' && this.solicitudesCuenta) {
      const s = await this.solicitudesCuenta.buscarPorId(e);
      if (!s) return this.noDisponible(base);
      const plan = CATALOGO_PLANES.find((p) => p.id === PLAN_POR_TIPO_CUENTA[s.props.tipoSolicitado]);
      return { ...base, etiqueta: `Solicitud de cuenta ${ETIQUETA_TIPO_CUENTA[s.props.tipoSolicitado]}`, campos: limpiar([campo('Tipo de cuenta solicitado', ETIQUETA_TIPO_CUENTA[s.props.tipoSolicitado]), campo('Nombre del negocio / empresa / institución', s.props.nombreOrganizacion), campo('A qué se dedica', s.props.descripcion), campo('RUC u otro documento', s.props.identificacion), campo('Sitio web', s.props.sitioWeb), campo('Plan que le corresponde', plan ? `${plan.nombre} (${plan.precioTexto})` : undefined)]) };
    }
    if (v.props.tipoEntidad === 'Cultivo') {
      const c = await this.cultivos.buscarPorId(e);
      if (!c) return this.noDisponible(base);
      const planta = await this.plantas.buscarPorId(c.props.plantaId);
      const p = c.props;
      const meses = (m: number[]) => m.map((n) => MESES[n - 1]).join(', ');
      return { ...base, etiqueta: `Ficha de cultivo de ${planta?.props.nombreComun ?? p.plantaId}`, campos: limpiar([campo('Planta', planta?.props.nombreComun), campo('Zona de cultivo', p.zonaCultivo), campo('Condiciones climáticas', p.condicionesClimaticas), campo('Tipo de suelo', p.tipoSuelo), campo('Altitud aproximada', p.altitudAprox), campo('Agua necesaria', p.aguaNecesaria), campo('Exposición solar', p.exposicionSolar), campo('Época de siembra', p.epocaSiembra), campo('Método de propagación', p.metodoPropagacion), campo('Tiempo de crecimiento', p.tiempoCrecimiento), campo('Cuidados', p.cuidados), campo('Plagas comunes', p.plagasComunes), campo('Época de cosecha', p.epocaCosecha), campo('Meses de siembra', meses(p.calendario.mesesSiembra)), campo('Meses de cosecha', meses(p.calendario.mesesCosecha)), campo('Consejos de recolección', p.consejosRecoleccion), campo('Contra la sobreexplotación', p.recomendacionesSobreexplotacion), campo('Fuente', p.fuente.valor)]) };
    }
    return base;
  }

  private noDisponible(base: DetalleValidacion): DetalleValidacion {
    return { ...base, campos: [{ etiqueta: 'Contenido', valor: 'El contenido asociado ya no existe.' }] };
  }

  private async relacionadoParteUso(x: ParteUso): Promise<{ titulo: string; campos: CampoDetalle[] }> {
    const uso = await this.usos.buscarPorId(x.props.usoId);
    return {
      titulo: `Parte medicinal y uso propuestos (${x.props.estadoValidacion})`,
      campos: limpiar([campo('Parte utilizada', x.props.parte === 'Otra' && x.props.parteDetalle ? `Otra: ${x.props.parteDetalle}` : x.props.parte), campo('Uso / finalidad', uso?.props.nombre), campo('Para qué se usa y por qué', x.props.motivoUso), campo('Tipo de conocimiento', x.props.tipoConocimiento), campo('Contraindicaciones (según la fuente)', x.props.contraindicaciones), campo('Fuente', x.props.fuente.valor)]),
    };
  }
}
