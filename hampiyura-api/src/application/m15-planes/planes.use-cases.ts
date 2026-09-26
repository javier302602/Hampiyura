import { randomUUID } from 'crypto';
import { PagoContacto, EstadoPagoEfectivo } from '../../domain/entities/pago-contacto.entity';
import { PagoContactoRepositoryPort } from '../../domain/ports/out/pago-contacto.repository.port';
import { UsuarioRepositoryPort } from '../../domain/ports/out/usuario.repository.port';
import { MapaCultivoPort } from '../../domain/ports/out/mapa-cultivo.port';
import { CultivoRepositoryPort } from '../../domain/ports/out/cultivo.repository.port';
import { PlantaRepositoryPort } from '../../domain/ports/out/planta.repository.port';
import { ProductoRepositoryPort } from '../../domain/ports/out/producto.repository.port';
import { NotificadorPort } from '../../domain/ports/out/notificador.port';
import { CATALOGO_PLANES, DefinicionPlan, PORCENTAJE_FONDO_CONSERVACION, PlanActivo, NIVEL_PLAN, tieneFiltrosAvanzados, esMetodoPago, esPlanDePago, precioDe, PlanDePago, MetodoPago, ConceptoPago } from '../../domain/value-objects/plan.vo';
import { ZONAS_GENERALES, ZONA_NO_ESPECIFICADA, OTRA_ZONA } from '../../domain/value-objects/zona-general.vo';
import { NotFoundError, UnauthorizedError, ValidationError } from '../../domain/errors/domain.errors';

export interface DatosDeCobro { yape: { numero: string; titular: string } | null; plin: { numero: string; titular: string } | null; }
export interface Solicitante { id: string; rol: string; }

// ---------- Acceso al contacto (regla de negocio del cap. 3 del modelo) ----------
// El contacto de un productor lo ve: el propio productor, un administrador, quien tenga un plan de pago
// VIGENTE (Negocio, Empresarial o Institucional: contactos ilimitados) o quien tenga un desbloqueo VIGENTE de ESE productor.
// Un plan pagado NO se salta nada más: no altera la validación M-09 ni las ubicaciones exactas (RN-07).
export class AccesoContactoService {
  constructor(private readonly pagos: PagoContactoRepositoryPort) {}

  // Devuelve el plan de MAYOR nivel que esté vigente (Institucional > Empresarial > Negocio); sin ninguno, Explorador.
  async planActivo(usuarioId: string, ahora = new Date()): Promise<{ plan: PlanActivo; vigenteHasta?: Date }> {
    const propios = (await this.pagos.listarPorUsuario(usuarioId)).filter((p) => p.props.concepto === 'Plan' && p.props.plan !== undefined && (p.props.plan as string) in NIVEL_PLAN && p.estaVigente(ahora));
    const elegido = propios.sort((a, b) => NIVEL_PLAN[b.props.plan as PlanActivo] - NIVEL_PLAN[a.props.plan as PlanActivo] || b.props.vigenteHasta!.getTime() - a.props.vigenteHasta!.getTime())[0];
    return elegido ? { plan: elegido.props.plan as PlanActivo, vigenteHasta: elegido.props.vigenteHasta } : { plan: 'Explorador' };
  }

  async desbloqueoVigente(usuarioId: string, productorId: string, ahora = new Date()): Promise<PagoContacto | undefined> {
    return (await this.pagos.listarPorUsuario(usuarioId)).find((p) => p.props.concepto === 'Desbloqueo' && p.props.productorId === productorId && p.estaVigente(ahora));
  }

  async puedeVerContacto(solicitante: Solicitante | undefined, productorId: string, ahora = new Date()): Promise<boolean> {
    if (!solicitante) return false;
    if (solicitante.id === productorId || solicitante.rol === 'Administrador') return true;
    if ((await this.planActivo(solicitante.id, ahora)).plan !== 'Explorador') return true;
    return !!(await this.desbloqueoVigente(solicitante.id, productorId, ahora));
  }
}

// ---------- Catálogo público de planes ----------
export interface CatalogoPublico {
  planes: DefinicionPlan[];
  cobro: DatosDeCobro;
  fondoConservacion: { porcentaje: number; acumuladoSoles: number; esContador: true };
}
export class ListarPlanesUseCase {
  constructor(private readonly pagos: PagoContactoRepositoryPort, private readonly cobro: DatosDeCobro) {}
  async ejecutar(): Promise<CatalogoPublico> {
    // Solo un CONTADOR VISIBLE: X % de lo confirmado en Negocio/Institucional. No mueve dinero.
    const confirmados = (await this.pagos.listar('Confirmado')).filter((p) => p.props.concepto === 'Plan');
    const total = confirmados.reduce((s, p) => s + p.props.monto, 0);
    return {
      planes: CATALOGO_PLANES, cobro: this.cobro,
      fondoConservacion: { porcentaje: PORCENTAJE_FONDO_CONSERVACION, acumuladoSoles: Math.round(total * PORCENTAJE_FONDO_CONSERVACION) / 100, esContador: true },
    };
  }
}

// ---------- Directorio de productores contactables ----------
export interface ProductorContactable {
  id: string;
  nombre: string;
  nombreNegocio?: string;
  region: string;
  biografia?: string;
  plantas: string[];
  zonas: string[];
  // Datos de sus productos YA aprobados (públicos y gratis: la zona es la general de la lista fija, nunca el punto exacto).
  certificado: boolean;
  zonasProducto: string[];
  cantidadMaxima?: number;
  // Solo cuando se filtra por cercanía: 'zona' = misma provincia, 'departamento' = mismo departamento.
  cercania?: 'zona' | 'departamento';
}

// Filtros avanzados del directorio (plan Empresarial o Institucional). Sin coordenadas: la cercanía usa la zona general.
export interface FiltrosDirectorio { certificado?: boolean; cantidadMinima?: number; cerca?: string; }
// "Cantidad" del producto es texto libre ("20 unidades"): se lee el PRIMER número; si no hay, ese producto no cuenta para este filtro.
export function primerNumero(texto?: string): number | undefined {
  const m = texto?.match(/\d+(?:[.,]\d+)?/);
  return m ? Number(m[0].replace(',', '.')) : undefined;
}
const departamentoDe = (zona: string) => zona.split(', ')[1];
export interface ContactoProductor { telefono?: string; contactosDeProductos: string[]; }
export interface FichaProductor extends ProductorContactable {
  contactoDisponible: boolean;
  // null = bloqueado (sin plan activo ni desbloqueo vigente para este productor).
  contacto: ContactoProductor | null;
  desbloqueoHasta?: Date;
}

// Regla real (punto 4): solo aparece como contactable un usuario con rol Productor que tenga al menos una
// ubicación registrada sobre una FICHA DE CULTIVO VALIDADA (M-03, ya pasó por M-09). No se muestran
// coordenadas: solo la zona en texto y los nombres de las plantas (RN-07 sigue vigente).
export class DirectorioProductoresUseCase {
  constructor(
    private readonly usuarios: UsuarioRepositoryPort, private readonly mapa: MapaCultivoPort, private readonly cultivos: CultivoRepositoryPort,
    private readonly plantas: PlantaRepositoryPort, private readonly productos: ProductoRepositoryPort, private readonly acceso: AccesoContactoService,
  ) {}

  private async contactables(): Promise<ProductorContactable[]> {
    const productores = (await this.usuarios.listar()).filter((u) => u.props.rol === 'Productor' && u.props.estado === 'Activo');
    if (productores.length === 0) return [];
    const ubicaciones = await this.mapa.listarTodas();
    const validada = new Map<string, boolean>();
    const resultado: ProductorContactable[] = [];
    const productosAprobados = (await this.productos.listar()).filter((p) => p.esVisiblePublicamente());
    for (const u of productores) {
      const plantas = new Set<string>(); const zonas = new Set<string>();
      for (const ub of ubicaciones.filter((x) => x.props.autorId === u.props.id)) {
        if (!validada.has(ub.props.cultivoId)) validada.set(ub.props.cultivoId, (await this.cultivos.buscarPorId(ub.props.cultivoId))?.props.estadoValidacion === 'Validado');
        if (!validada.get(ub.props.cultivoId)) continue;
        plantas.add((await this.plantas.buscarPorId(ub.props.plantaId))?.props.nombreComun ?? ub.props.plantaId);
        zonas.add(ub.props.zona);
      }
      if (plantas.size === 0) continue;
      resultado.push({ id: u.props.id, nombre: u.props.nombre, nombreNegocio: u.props.nombreNegocio ?? undefined, region: u.props.region, biografia: u.props.biografia ?? undefined, plantas: [...plantas], zonas: [...zonas], ...this.datosDeProductos(productosAprobados.filter((p) => p.props.productorId === u.props.id)) });
    }
    return resultado.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }

  private datosDeProductos(productos: { props: { localidad: string; cantidad?: string; etiquetaCertificado: boolean } }[]) {
    const cantidades = productos.map((p) => primerNumero(p.props.cantidad)).filter((n): n is number => n !== undefined);
    return {
      certificado: productos.some((p) => p.props.etiquetaCertificado),
      zonasProducto: [...new Set(productos.map((p) => p.props.localidad).filter((z) => z && z !== ZONA_NO_ESPECIFICADA))],
      cantidadMaxima: cantidades.length ? Math.max(...cantidades) : undefined,
    };
  }

  // Sin filtros = como siempre (para todos). Con cualquier filtro avanzado: solo plan Empresarial o Institucional vigente (o administrador).
  async listar(filtros: FiltrosDirectorio = {}, solicitante?: Solicitante): Promise<ProductorContactable[]> {
    const todos = await this.contactables();
    const hayFiltros = !!filtros.certificado || filtros.cantidadMinima !== undefined || !!filtros.cerca;
    if (!hayFiltros) return todos;
    const autorizado = !!solicitante && (solicitante.rol === 'Administrador' || tieneFiltrosAvanzados((await this.acceso.planActivo(solicitante.id)).plan));
    if (!autorizado) throw new UnauthorizedError('Los filtros avanzados son del plan Empresarial o Institucional');
    if (filtros.cerca && !ZONAS_GENERALES.includes(filtros.cerca)) throw new ValidationError('Elige una zona de la lista');
    let salida = todos;
    if (filtros.certificado) salida = salida.filter((p) => p.certificado);
    if (filtros.cantidadMinima !== undefined) salida = salida.filter((p) => p.cantidadMaxima !== undefined && p.cantidadMaxima >= filtros.cantidadMinima!);
    if (filtros.cerca) {
      const dep = filtros.cerca === OTRA_ZONA ? undefined : departamentoDe(filtros.cerca);
      salida = salida.flatMap((p) => {
        const cercania = p.zonasProducto.includes(filtros.cerca!) ? 'zona' as const : (dep && p.zonasProducto.some((z) => departamentoDe(z) === dep)) ? 'departamento' as const : undefined;
        return cercania ? [{ ...p, cercania }] : [];
      }).sort((a, b) => (a.cercania === 'zona' ? 0 : 1) - (b.cercania === 'zona' ? 0 : 1) || a.nombre.localeCompare(b.nombre, 'es'));
    }
    return salida;
  }

  async obtener(productorId: string, solicitante?: Solicitante): Promise<FichaProductor> {
    const ficha = (await this.contactables()).find((p) => p.id === productorId);
    if (!ficha) throw new NotFoundError('Este productor no está disponible en el directorio (necesita una ficha de cultivo validada)');
    const permitido = await this.acceso.puedeVerContacto(solicitante, productorId);
    if (!permitido) return { ...ficha, contactoDisponible: false, contacto: null };
    const usuario = await this.usuarios.buscarPorId(productorId);
    const contactosDeProductos = (await this.productos.listar()).filter((p) => p.props.productorId === productorId && p.esVisiblePublicamente()).map((p) => p.props.contactoVendedor);
    const desbloqueo = solicitante ? await this.acceso.desbloqueoVigente(solicitante.id, productorId) : undefined;
    return { ...ficha, contactoDisponible: true, contacto: { telefono: usuario?.props.telefono ?? undefined, contactosDeProductos: [...new Set(contactosDeProductos)] }, desbloqueoHasta: desbloqueo?.props.vigenteHasta };
  }

  async esContactable(productorId: string): Promise<boolean> { return (await this.contactables()).some((p) => p.id === productorId); }
}

// ---------- Contacto en las fichas de producto (M-11) ----------
// La ficha de producto traía `contactoVendedor` a cualquiera: saltaba el muro de pago. Ahora solo lo ve quien
// tenga acceso al contacto de ese productor; el resto recibe contactoBloqueado=true.
// Ronda 18: el muro de pago cubre CONTACTO y UBICACIÓN EXACTA (dónde se fabrica). La ficha, las fotos, la descripción, el
// precio y la localidad general siguen siendo gratis; el punto exacto (latitud/longitud) y el contacto directo, no.
export class ProtegerContactoProductosUseCase {
  constructor(private readonly acceso: AccesoContactoService) {}
  async aplicar<T extends { productorId: string; contactoVendedor: string; latitud?: number; longitud?: number }>(productos: T[], solicitante?: Solicitante): Promise<(Omit<T, 'contactoVendedor' | 'latitud' | 'longitud'> & { contactoVendedor: string | null; latitud?: number; longitud?: number; contactoBloqueado: boolean })[]> {
    const permiso = new Map<string, boolean>();
    const salida = [];
    for (const p of productos) {
      if (!permiso.has(p.productorId)) permiso.set(p.productorId, await this.acceso.puedeVerContacto(solicitante, p.productorId));
      const ok = permiso.get(p.productorId)!;
      if (ok) { salida.push({ ...p, contactoBloqueado: false }); continue; }
      const { latitud: _lat, longitud: _lon, ...resto } = p;
      salida.push({ ...resto, contactoVendedor: null, contactoBloqueado: true });
    }
    return salida;
  }
}

// ---------- Pagos ----------
export interface SolicitarPagoInput {
  usuarioId: string; rol: string; concepto: ConceptoPago; plan?: string; productorId?: string;
  metodo: string; numeroOperacion?: string; comprobanteUrl: string;
}
export class SolicitarPagoUseCase {
  constructor(private readonly pagos: PagoContactoRepositoryPort, private readonly directorio: DirectorioProductoresUseCase, private readonly acceso: AccesoContactoService) {}
  async ejecutar(input: SolicitarPagoInput): Promise<PagoContacto> {
    if (!esMetodoPago(input.metodo)) throw new ValidationError('El método de pago debe ser Yape o Plin');
    // Solo comprobantes subidos a esta plataforma (POST /publicaciones/media): nunca una URL arbitraria.
    if (!input.comprobanteUrl?.startsWith('/uploads/')) throw new ValidationError('Sube la captura del comprobante de pago');
    const previos = await this.pagos.listarPorUsuario(input.usuarioId);
    let plan: PlanDePago | undefined; let productorId: string | undefined; let monto: number;
    if (input.concepto === 'Plan') {
      if (!input.plan || !esPlanDePago(input.plan)) throw new ValidationError('Elige un plan de pago: Negocio, Empresarial o Institucional');
      plan = input.plan; monto = precioDe(plan);
      if (previos.some((p) => p.props.concepto === 'Plan' && p.props.plan === plan && p.props.estado === 'Pendiente')) throw new ValidationError('Ya tienes un pago de este plan esperando confirmación');
    } else if (input.concepto === 'Desbloqueo') {
      if (!input.productorId) throw new ValidationError('Indica de qué productor es el contacto');
      if (input.productorId === input.usuarioId) throw new ValidationError('No necesitas desbloquear tu propio contacto');
      if (!(await this.directorio.esContactable(input.productorId))) throw new ValidationError('Este productor no está disponible en el directorio (necesita una ficha de cultivo validada)');
      if (await this.acceso.desbloqueoVigente(input.usuarioId, input.productorId)) throw new ValidationError('Ya tienes desbloqueado el contacto de este productor');
      if (previos.some((p) => p.props.concepto === 'Desbloqueo' && p.props.productorId === input.productorId && p.props.estado === 'Pendiente')) throw new ValidationError('Ya tienes un pago de este contacto esperando confirmación');
      productorId = input.productorId; monto = precioDe('DesbloqueoPuntual');
    } else throw new ValidationError('Concepto de pago no reconocido');
    const pago = new PagoContacto({
      id: randomUUID(), usuarioId: input.usuarioId, concepto: input.concepto, plan, productorId, monto, metodo: input.metodo as MetodoPago,
      numeroOperacion: input.numeroOperacion?.trim() || undefined, comprobanteUrl: input.comprobanteUrl, estado: 'Pendiente', creadoEn: new Date(),
    });
    await this.pagos.guardar(pago);
    return pago;
  }
}

export interface PagoVisible {
  id: string; usuarioId: string; usuarioNombre: string; usuarioCorreo: string;
  concepto: ConceptoPago; plan?: string; productorId?: string; productorNombre?: string; conceptoTexto: string;
  monto: number; metodo: string; numeroOperacion?: string; comprobanteUrl: string;
  estado: EstadoPagoEfectivo; creadoEn: Date; revisadoEn?: Date; revisadoPorNombre?: string; motivoRechazo?: string; vigenteDesde?: Date; vigenteHasta?: Date;
}

class Presentador {
  constructor(protected readonly usuarios: UsuarioRepositoryPort) {}
  protected async aVista(p: PagoContacto): Promise<PagoVisible> {
    const usuario = await this.usuarios.buscarPorId(p.props.usuarioId);
    const productor = p.props.productorId ? await this.usuarios.buscarPorId(p.props.productorId) : null;
    const revisor = p.props.revisadoPorId ? await this.usuarios.buscarPorId(p.props.revisadoPorId) : null;
    const productorNombre = productor ? (productor.props.nombreNegocio ? `${productor.props.nombreNegocio} (${productor.props.nombre})` : productor.props.nombre) : undefined;
    return {
      id: p.props.id, usuarioId: p.props.usuarioId, usuarioNombre: usuario?.props.nombre ?? p.props.usuarioId, usuarioCorreo: usuario?.props.correo ?? '',
      concepto: p.props.concepto, plan: p.props.plan, productorId: p.props.productorId, productorNombre,
      conceptoTexto: p.props.concepto === 'Plan' ? `Plan ${p.props.plan}` : `Desbloqueo del contacto de ${productorNombre ?? p.props.productorId}`,
      monto: p.props.monto, metodo: p.props.metodo, numeroOperacion: p.props.numeroOperacion, comprobanteUrl: p.props.comprobanteUrl,
      estado: p.estadoEfectivo(), creadoEn: p.props.creadoEn, revisadoEn: p.props.revisadoEn, revisadoPorNombre: revisor?.props.nombre, motivoRechazo: p.props.motivoRechazo,
      vigenteDesde: p.props.vigenteDesde, vigenteHasta: p.props.vigenteHasta,
    };
  }
}

// Mi plan: plan activo, vencimiento y estado de pago del usuario, más sus desbloqueos y su historial.
export interface MiPlan {
  plan: PlanActivo;
  vencimiento?: Date;
  // Estado de pago de la suscripción más reciente (Pendiente / Confirmado / Vencido / Rechazado); null si nunca pagó un plan.
  estadoPago: EstadoPagoEfectivo | null;
  desbloqueos: { productorId: string; productorNombre: string; vigenteHasta: Date }[];
  pagos: PagoVisible[];
}
export class MiPlanUseCase extends Presentador {
  constructor(private readonly pagos: PagoContactoRepositoryPort, usuarios: UsuarioRepositoryPort, private readonly acceso: AccesoContactoService) { super(usuarios); }
  async ejecutar(usuarioId: string): Promise<MiPlan> {
    const activo = await this.acceso.planActivo(usuarioId);
    const propios = (await this.pagos.listarPorUsuario(usuarioId)).sort((a, b) => b.props.creadoEn.getTime() - a.props.creadoEn.getTime());
    const suscripciones = propios.filter((p) => p.props.concepto === 'Plan' && (p.props.plan as string) in NIVEL_PLAN);
    const pagos = await Promise.all(propios.map((p) => this.aVista(p)));
    const desbloqueos = await Promise.all(propios.filter((p) => p.props.concepto === 'Desbloqueo' && p.estaVigente()).map(async (p) => ({
      productorId: p.props.productorId!, productorNombre: (await this.usuarios.buscarPorId(p.props.productorId!))?.props.nombre ?? p.props.productorId!, vigenteHasta: p.props.vigenteHasta!,
    })));
    return {
      plan: activo.plan, vencimiento: activo.vigenteHasta,
      estadoPago: activo.plan !== 'Explorador' ? 'Confirmado' : (suscripciones[0]?.estadoEfectivo() ?? null),
      desbloqueos, pagos,
    };
  }
}

// ---------- Administración de pagos (bandeja) ----------
export class ListarPagosAdminUseCase extends Presentador {
  constructor(private readonly pagos: PagoContactoRepositoryPort, usuarios: UsuarioRepositoryPort) { super(usuarios); }
  async ejecutar(estado?: 'Pendiente' | 'Confirmado' | 'Rechazado'): Promise<PagoVisible[]> { return Promise.all((await this.pagos.listar(estado)).map((p) => this.aVista(p))); }
  async detalle(id: string): Promise<PagoVisible> {
    const p = await this.pagos.buscarPorId(id);
    if (!p) throw new NotFoundError(`Pago no encontrado: ${id}`);
    return this.aVista(p);
  }
}
export class ResolverPagoUseCase {
  constructor(private readonly pagos: PagoContactoRepositoryPort, private readonly notificador: NotificadorPort) {}
  async confirmar(id: string, adminId: string): Promise<void> {
    const p = await this.pagos.buscarPorId(id);
    if (!p) throw new NotFoundError(`Pago no encontrado: ${id}`);
    p.confirmar(adminId);
    await this.pagos.actualizar(p);
    await this.notificador.notificar(p.props.usuarioId, 'pago_confirmado', { entidadTipo: 'PagoContacto', entidadId: p.props.id });
  }
  async rechazar(id: string, adminId: string, motivo: string): Promise<void> {
    const p = await this.pagos.buscarPorId(id);
    if (!p) throw new NotFoundError(`Pago no encontrado: ${id}`);
    p.rechazar(adminId, motivo);
    await this.pagos.actualizar(p);
    await this.notificador.notificar(p.props.usuarioId, 'pago_rechazado', { entidadTipo: 'PagoContacto', entidadId: p.props.id });
  }
}
