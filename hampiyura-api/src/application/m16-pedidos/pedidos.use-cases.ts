import { randomUUID } from 'crypto';
import { Pedido, PedidoProps, EstadoPedido, METODOS_COBRO } from '../../domain/entities/pedido.entity';
import { Producto } from '../../domain/entities/producto.entity';
import { CobroProductoRepositoryPort, PedidoRepositoryPort } from '../../domain/ports/out/pedidos.ports';
import { ProductoRepositoryPort } from '../../domain/ports/out/producto.repository.port';
import { UsuarioRepositoryPort } from '../../domain/ports/out/usuario.repository.port';
import { NotificadorPort } from '../../domain/ports/out/notificador.port';
import { CORREO_CUENTA_EJEMPLO, CobroInput, MAX_CANTIDAD_PEDIDO, precioNumerico, validarCobro } from '../../domain/value-objects/cobro-producto.vo';
import { PORCENTAJE_COMISION, VERSION_CONTRATO, generarContrato } from '../../domain/value-objects/contrato-compraventa.vo';
import { ENVIO_LARGO_KM, calcularCostoEnvio, calcularDistanciaKm, envioEsLargo } from '../../domain/value-objects/envio.vo';
import { NotFoundError, UnauthorizedError, ValidationError } from '../../domain/errors/domain.errors';

// M-16 · Compra directa: el comprador paga al vendedor (Yape / Plin / cuenta) y todo queda registrado con su contrato. HampiYura no custodia dinero.
// latitud/longitud: obligatorias -- el comprador marca su ubicación en el mapa (igual selector que usa el vendedor al publicar) para calcular
// el envío por distancia real; sin eso no hay forma honesta de calcular un costo (ver envio.vo.ts). referencia: solo se exige si el envío es largo.
export interface EntregaInput { nombre: string; telefono: string; direccion: string; latitud: number; longitud: number; referencia?: string }
export interface Solicitante { id: string; rol: string }
const redondear = (n: number) => Math.round(n * 100) / 100;

interface InfoEnvio { costoEnvio: number; distanciaKm?: number; envioLargo: boolean }
function calcularEnvio(p: Producto, entrega?: EntregaInput): InfoEnvio {
  if (!entrega || p.props.latitud == null || p.props.longitud == null || typeof entrega.latitud !== 'number' || typeof entrega.longitud !== 'number') {
    return { costoEnvio: 0, envioLargo: false };
  }
  const distanciaKm = calcularDistanciaKm(p.props.latitud, p.props.longitud, entrega.latitud, entrega.longitud);
  return { costoEnvio: calcularCostoEnvio(distanciaKm), distanciaKm, envioLargo: envioEsLargo(distanciaKm) };
}

// Qué se le muestra al que mira el producto: nunca los números de cobro, solo QUÉ medios acepta y si se puede comprar.
// stockDisponible: null/undefined = el vendedor no lo gestiona (sin límite mostrado); un número es real y público para todos.
export interface EstadoCompra { comprable: boolean; motivo?: string; esDemostracion: boolean; medios: string[]; entregaDias?: number; precioUnitario?: number; stockDisponible?: number | null }

export class EstadoCompraProductoUseCase {
  constructor(private readonly productos: ProductoRepositoryPort, private readonly cobros: CobroProductoRepositoryPort, private readonly usuarios: UsuarioRepositoryPort) {}
  async ejecutar(productoId: string, solicitanteId?: string): Promise<EstadoCompra> {
    const p = await this.productos.buscarPorId(productoId);
    if (!p || !p.esVisiblePublicamente()) throw new NotFoundError(`Producto no encontrado: ${productoId}`);
    const vendedor = await this.usuarios.buscarPorId(p.props.productorId);
    const esDemostracion = vendedor?.props.correo.toLowerCase() === CORREO_CUENTA_EJEMPLO;
    const cobro = await this.cobros.obtener(productoId);
    const medios = cobro ? [cobro.yape && 'Yape', cobro.plin && 'Plin', cobro.cuenta && 'Cuenta bancaria'].filter((x): x is string => !!x) : [];
    const precioUnitario = precioNumerico(p.props.precioReferencial);
    const sinStock = p.props.stockDisponible != null && p.props.stockDisponible <= 0;
    let motivo: string | undefined;
    if (esDemostracion) motivo = 'Este es un producto de demostración: no se puede pedir ni pagar.';
    else if (!vendedor || vendedor.props.estado !== 'Activo') motivo = 'El vendedor no está disponible.';
    else if (!cobro) motivo = 'El vendedor todavía no registró cómo cobrar: no se puede comprar por ahora.';
    else if (precioUnitario === undefined) motivo = 'El producto no tiene un precio claro (ej. "S/ 14"): no se puede comprar por ahora.';
    else if (sinStock) motivo = 'Sin stock disponible por ahora.';
    else if (solicitanteId && solicitanteId === p.props.productorId) motivo = 'Es tu propio producto.';
    return { comprable: !motivo, motivo, esDemostracion, medios, entregaDias: cobro?.entregaDias, precioUnitario, stockDisponible: p.props.stockDisponible };
  }
}

// El vendedor registra (o cambia) a dónde le pagan y en cuántos días entrega: ese es su compromiso de entrega para los pedidos futuros.
export class ConfigurarCobroUseCase {
  constructor(private readonly productos: ProductoRepositoryPort, private readonly cobros: CobroProductoRepositoryPort) {}
  // Ronda 36: stock REAL en unidades (null = deja de gestionarlo). Solo el dueño; baja solo cuando se confirma un pago (ver PedidosUseCase).
  async fijarStock(vendedor: Solicitante, productoId: string, unidades: number | null): Promise<void> {
    const p = await this.productos.buscarPorId(productoId);
    if (!p) throw new NotFoundError(`Producto no encontrado: ${productoId}`);
    if (p.props.productorId !== vendedor.id) throw new UnauthorizedError('Solo quien publicó el producto puede fijar su stock');
    p.fijarStock(unidades);
    await this.productos.actualizar(p);
  }
  async ejecutar(vendedor: Solicitante, productoId: string, input: CobroInput & { aceptaCompromiso?: boolean }, ahora = new Date()): Promise<void> {
    const p = await this.productos.buscarPorId(productoId);
    if (!p) throw new NotFoundError(`Producto no encontrado: ${productoId}`);
    if (p.props.productorId !== vendedor.id) throw new UnauthorizedError('Solo quien publicó el producto puede configurar cómo cobra');
    const v = validarCobro(input);
    if (!input.aceptaCompromiso) throw new ValidationError(`Debes aceptar el compromiso de entrega: entregarás en un máximo de ${v.entregaDias} días desde que confirmes el pago o devolverás el dinero íntegro`);
    await this.cobros.guardar({ productoId, ...v, compromisoEn: ahora });
  }
  async obtenerParaVendedor(vendedor: Solicitante, productoId: string) {
    const p = await this.productos.buscarPorId(productoId);
    if (!p || p.props.productorId !== vendedor.id) throw new NotFoundError('Producto no encontrado');
    return (await this.cobros.obtener(productoId)) ?? null; // el propio vendedor sí ve sus números
  }
}

export interface PedidoNuevoInput { productoId: string; cantidad: number; entrega?: EntregaInput }
export class PedidosUseCase {
  constructor(
    private readonly pedidos: PedidoRepositoryPort, private readonly productos: ProductoRepositoryPort, private readonly cobros: CobroProductoRepositoryPort,
    private readonly usuarios: UsuarioRepositoryPort, private readonly notificador: NotificadorPort,
  ) {}

  private async armar(compradorId: string, input: PedidoNuevoInput, ahora: Date) {
    const cantidad = input.cantidad;
    if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > MAX_CANTIDAD_PEDIDO) throw new ValidationError(`La cantidad debe ser un número entero de 1 a ${MAX_CANTIDAD_PEDIDO}`);
    const p = await this.productos.buscarPorId(input.productoId);
    if (!p || !p.esVisiblePublicamente()) throw new NotFoundError('Producto no encontrado');
    if (p.props.productorId === compradorId) throw new ValidationError('No puedes comprar tu propio producto');
    const [vendedor, comprador, cobro] = await Promise.all([this.usuarios.buscarPorId(p.props.productorId), this.usuarios.buscarPorId(compradorId), this.cobros.obtener(input.productoId)]);
    if (!vendedor || !comprador) throw new NotFoundError('Usuario no encontrado');
    if (vendedor.props.correo.toLowerCase() === CORREO_CUENTA_EJEMPLO) throw new ValidationError('Este es un producto de demostración: no se puede pedir ni pagar');
    if (vendedor.props.estado !== 'Activo') throw new ValidationError('El vendedor no está disponible');
    if (!cobro) throw new ValidationError('El vendedor todavía no registró cómo cobrar: no se puede comprar por ahora');
    if (!p.hayStockPara(cantidad)) throw new ValidationError(p.props.stockDisponible === 0 ? 'Sin stock disponible por ahora' : `Solo quedan ${p.props.stockDisponible} unidad(es) disponible(s)`);
    const precioUnitario = precioNumerico(p.props.precioReferencial);
    if (precioUnitario === undefined) throw new ValidationError('El producto no tiene un precio claro: no se puede comprar por ahora');
    const subtotal = redondear(precioUnitario * cantidad);
    const envio = calcularEnvio(p, input.entrega);
    const total = redondear(subtotal + envio.costoEnvio);
    const medios = [cobro.yape && 'Yape', cobro.plin && 'Plin', cobro.cuenta && 'Cuenta bancaria'].filter((x): x is string => !!x);
    return { p, vendedor, comprador, cobro, precioUnitario, cantidad, subtotal, total, medios, ...envio };
  }

  // Vista previa: el contrato que se aceptaría y el total, ANTES de crear nada (el comprador lo lee y luego acepta).
  async vistaPrevia(compradorId: string, input: PedidoNuevoInput, ahora = new Date()) {
    const a = await this.armar(compradorId, input, ahora);
    const contrato = generarContrato({
      fecha: ahora, comprador: { nombre: a.comprador.props.nombre, correo: a.comprador.props.correo }, vendedor: { nombre: a.vendedor.props.nombre, nombreNegocio: a.vendedor.props.nombreNegocio ?? undefined },
      producto: { nombre: a.p.props.nombre }, cantidad: a.cantidad, precioUnitario: a.precioUnitario, subtotal: a.subtotal, costoEnvio: a.costoEnvio, distanciaKm: a.distanciaKm, entregaDias: a.cobro.entregaDias, medios: a.medios, entrega: input.entrega,
    });
    return {
      contrato, subtotal: a.subtotal, costoEnvio: a.costoEnvio, distanciaKm: a.distanciaKm, envioLargo: a.envioLargo, total: a.total,
      precioUnitario: a.precioUnitario, cantidad: a.cantidad, entregaDias: a.cobro.entregaDias, medios: a.medios, comisionReferencial: redondear(a.subtotal * PORCENTAJE_COMISION / 100),
    };
  }

  async crear(compradorId: string, input: PedidoNuevoInput & { aceptaContrato?: boolean }, ahora = new Date()): Promise<Pedido> {
    const e = input.entrega;
    if (!e || (e.nombre ?? '').trim().length < 3) throw new ValidationError('Indica el nombre de quien recibe');
    if (!/^\+?[\d\s-]{7,15}$/.test((e.telefono ?? '').trim())) throw new ValidationError('Indica un teléfono de contacto para la entrega (7 a 15 dígitos)');
    if ((e.direccion ?? '').trim().length < 8) throw new ValidationError('Indica la dirección de entrega completa (calle, número, distrito y ciudad)');
    if (typeof e.latitud !== 'number' || typeof e.longitud !== 'number' || Number.isNaN(e.latitud) || Number.isNaN(e.longitud)) throw new ValidationError('Marca tu ubicación en el mapa para calcular el envío');
    if (input.aceptaContrato !== true) throw new ValidationError('Debes leer y aceptar el contrato de compraventa para hacer el pedido');
    const a = await this.armar(compradorId, input, ahora);
    if (a.envioLargo && (e.referencia ?? '').trim().length < 3) throw new ValidationError(`La entrega queda a más de ${ENVIO_LARGO_KM} km del vendedor: indica un punto de referencia conocido y cercano (ej. "paradero de la plaza de armas") para coordinar ahí la entrega`);
    const id = randomUUID();
    const entrega = { nombre: e.nombre.trim(), telefono: e.telefono.trim(), direccion: e.direccion.trim(), latitud: e.latitud, longitud: e.longitud, referencia: (e.referencia ?? '').trim() || undefined };
    const contratoTexto = generarContrato({
      fecha: ahora, pedidoId: id, comprador: { nombre: a.comprador.props.nombre, correo: a.comprador.props.correo }, vendedor: { nombre: a.vendedor.props.nombre, nombreNegocio: a.vendedor.props.nombreNegocio ?? undefined },
      producto: { nombre: a.p.props.nombre }, cantidad: a.cantidad, precioUnitario: a.precioUnitario, subtotal: a.subtotal, costoEnvio: a.costoEnvio, distanciaKm: a.distanciaKm, entregaDias: a.cobro.entregaDias, medios: a.medios, entrega,
    });
    const props: PedidoProps = {
      id, productoId: a.p.props.id, productoNombre: a.p.props.nombre, compradorId, vendedorId: a.vendedor.props.id,
      cantidad: a.cantidad, precioUnitario: a.precioUnitario, subtotal: a.subtotal, costoEnvio: a.costoEnvio, distanciaKm: a.distanciaKm, total: a.total, comisionReferencial: redondear(a.subtotal * PORCENTAJE_COMISION / 100),
      entregaNombre: entrega.nombre, entregaTelefono: entrega.telefono, entregaDireccion: entrega.direccion, entregaLatitud: entrega.latitud, entregaLongitud: entrega.longitud, entregaReferencia: entrega.referencia,
      cobro: { ...(a.cobro.yape ? { yape: a.cobro.yape } : {}), ...(a.cobro.plin ? { plin: a.cobro.plin } : {}), ...(a.cobro.cuenta ? { cuenta: a.cobro.cuenta } : {}) }, // copia: si el vendedor cambia sus datos después, este pedido conserva los de ahora
      estado: 'PendientePago', entregaDias: a.cobro.entregaDias, contratoVersion: VERSION_CONTRATO, contratoTexto,
      compradorAceptoEn: ahora, vendedorCompromisoEn: a.cobro.compromisoEn,
      eventos: [{ estado: 'PendientePago', fecha: ahora, actorId: compradorId, nota: 'Pedido creado; el comprador aceptó el contrato' }], creadoEn: ahora, actualizadoEn: ahora,
    };
    const pedido = new Pedido(props);
    await this.pedidos.guardar(pedido);
    await this.notificador.notificar(a.vendedor.props.id, 'pedido_nuevo', { entidadTipo: 'Pedido', entidadId: id, mensaje: `Nuevo pedido de ${a.comprador.props.nombre}: ${a.cantidad} × ${a.p.props.nombre} (S/ ${a.total.toFixed(2)}). Espera su comprobante de pago.` });
    return pedido;
  }

  private async cargar(id: string): Promise<Pedido> { const p = await this.pedidos.buscarPorId(id); if (!p) throw new NotFoundError('Pedido no encontrado'); return p; }
  // Misma respuesta para "no existe" y "no es tuyo": no se revela que el pedido existe.
  private async cargarParticipante(id: string, u: Solicitante): Promise<Pedido> {
    const p = await this.cargar(id);
    if (!p.esParticipante(u.id) && u.rol !== 'Administrador') throw new NotFoundError('Pedido no encontrado');
    return p;
  }

  async obtener(u: Solicitante, id: string) {
    const p = await this.cargarParticipante(id, u);
    const esComprador = u.id === p.props.compradorId; const esVendedor = u.id === p.props.vendedorId; const esAdmin = u.rol === 'Administrador';
    const [comprador, vendedor] = await Promise.all([this.usuarios.buscarPorId(p.props.compradorId), this.usuarios.buscarPorId(p.props.vendedorId)]);
    const { cobro, ...resto } = p.props;
    return {
      ...resto,
      compradorNombre: comprador?.props.nombre, vendedorNombre: vendedor?.props.nombreNegocio ?? vendedor?.props.nombre,
      rolDelSolicitante: esComprador ? 'comprador' : esVendedor ? 'vendedor' : 'administrador',
      // Los números de cobro solo los ve el COMPRADOR (para pagar) y el vendedor (son suyos); el administrador ve el pedido pero no necesita los números.
      cobro: esComprador || esVendedor ? cobro : undefined,
      plazoVencido: p.plazoVencido(),
      acciones: this.accionesPara(p, u),
    };
  }
  private accionesPara(p: Pedido, u: Solicitante): string[] {
    const e = p.props.estado; const a: string[] = [];
    if (u.id === p.props.compradorId) {
      if (e === 'PendientePago' || e === 'PagoRechazado') a.push('informarPago', 'cancelar');
      if (e === 'PagoConfirmado' || e === 'Enviado') a.push('confirmarRecepcion');
      if ((e === 'PagoConfirmado' && p.plazoVencido()) || e === 'Enviado') a.push('abrirReclamo');
    }
    if (u.id === p.props.vendedorId) {
      if (e === 'PagoInformado') a.push('confirmarPago', 'rechazarPago');
      if (e === 'PagoConfirmado') a.push('marcarEnviado');
    }
    if (u.rol === 'Administrador' && e === 'Reclamo') a.push('resolverReclamo');
    return a;
  }

  async listarMios(usuarioId: string, rol: 'comprador' | 'vendedor') {
    const lista = (await this.pedidos.listarDe(usuarioId, rol)).sort((a, b) => b.props.creadoEn.getTime() - a.props.creadoEn.getTime());
    return Promise.all(lista.map(async (p) => {
      const otro = await this.usuarios.buscarPorId(rol === 'comprador' ? p.props.vendedorId : p.props.compradorId);
      return { id: p.props.id, productoNombre: p.props.productoNombre, cantidad: p.props.cantidad, total: p.props.total, estado: p.props.estado, creadoEn: p.props.creadoEn, fechaLimiteEntrega: p.props.fechaLimiteEntrega, con: otro?.props.nombreNegocio ?? otro?.props.nombre ?? '—', plazoVencido: p.plazoVencido() };
    }));
  }
  async listarReclamos(u: Solicitante) {
    if (u.rol !== 'Administrador') throw new UnauthorizedError('Solo el administrador ve la bandeja de reclamos');
    return (await this.pedidos.listarPorEstado('Reclamo')).map((p) => ({ id: p.props.id, productoNombre: p.props.productoNombre, total: p.props.total, motivoReclamo: p.props.motivoReclamo, creadoEn: p.props.creadoEn }));
  }

  private async avisar(destinoId: string, tipo: string, p: Pedido, texto: string) { await this.notificador.notificar(destinoId, tipo, { entidadTipo: 'Pedido', entidadId: p.props.id, mensaje: texto }); }

  async informarPago(u: Solicitante, id: string, metodo: string, comprobanteUrl: string, numeroOperacion?: string, ahora = new Date()) {
    const p = await this.cargar(id); p.informarPago(u.id, metodo, comprobanteUrl, numeroOperacion, ahora); await this.pedidos.actualizar(p);
    await this.avisar(p.props.vendedorId, 'pedido_pago_informado', p, `El comprador subió el comprobante de "${p.props.productoNombre}" (S/ ${p.props.total.toFixed(2)}). Confirma si recibiste el pago.`);
  }
  async confirmarPago(u: Solicitante, id: string, ahora = new Date()) {
    const p = await this.cargar(id); p.confirmarPago(u.id, ahora); await this.pedidos.actualizar(p);
    // Ronda 36: el stock (si el vendedor lo gestiona) baja SOLO en este momento real -- nunca al solo pedir ni con el comprobante sin confirmar.
    const producto = await this.productos.buscarPorId(p.props.productoId);
    if (producto) { producto.descontarStock(p.props.cantidad); await this.productos.actualizar(producto); }
    await this.avisar(p.props.compradorId, 'pedido_pago_confirmado', p, `El vendedor confirmó tu pago de "${p.props.productoNombre}". Debe entregarlo en ${p.props.entregaDias} días.`);
  }
  async rechazarPago(u: Solicitante, id: string, motivo: string, ahora = new Date()) {
    const p = await this.cargar(id); p.rechazarPago(u.id, motivo, ahora); await this.pedidos.actualizar(p);
    await this.avisar(p.props.compradorId, 'pedido_pago_rechazado', p, `El vendedor no pudo confirmar tu pago de "${p.props.productoNombre}": ${p.props.motivoRechazoPago}`);
  }
  async marcarEnviado(u: Solicitante, id: string, nota: string, ahora = new Date()) {
    const p = await this.cargar(id); p.marcarEnviado(u.id, nota, ahora); await this.pedidos.actualizar(p);
    await this.avisar(p.props.compradorId, 'pedido_enviado', p, `Tu pedido "${p.props.productoNombre}" fue enviado. Confirma cuando lo recibas.`);
  }
  async confirmarRecepcion(u: Solicitante, id: string, ahora = new Date()) {
    const p = await this.cargar(id); p.confirmarRecepcion(u.id, ahora); await this.pedidos.actualizar(p);
    await this.avisar(p.props.vendedorId, 'pedido_recibido', p, `El comprador confirmó la recepción de "${p.props.productoNombre}". Pedido completado.`);
  }
  async abrirReclamo(u: Solicitante, id: string, motivo: string, ahora = new Date()) {
    const p = await this.cargar(id); p.abrirReclamo(u.id, motivo, ahora); await this.pedidos.actualizar(p);
    await this.avisar(p.props.vendedorId, 'pedido_reclamo', p, `El comprador abrió un reclamo por "${p.props.productoNombre}". El equipo de HampiYura lo revisará.`);
  }
  async resolverReclamo(u: Solicitante, id: string, resolucion: string, ahora = new Date()) {
    if (u.rol !== 'Administrador') throw new UnauthorizedError('Solo el administrador resuelve reclamos');
    const p = await this.cargar(id); p.resolverReclamo(u.id, resolucion, ahora); await this.pedidos.actualizar(p);
    for (const d of [p.props.compradorId, p.props.vendedorId]) await this.avisar(d, 'pedido_reclamo_cerrado', p, `El reclamo de "${p.props.productoNombre}" fue cerrado: ${p.props.resolucion}`);
  }
  async cancelar(u: Solicitante, id: string, ahora = new Date()) {
    const p = await this.cargar(id); p.cancelar(u.id, ahora); await this.pedidos.actualizar(p);
    await this.avisar(p.props.vendedorId, 'pedido_cancelado', p, `El comprador canceló el pedido de "${p.props.productoNombre}".`);
  }
}
export { METODOS_COBRO };
export type { EstadoPedido };
