import { Pedido, PedidoProps } from '../../src/domain/entities/pedido.entity';
import { validarCobro, precioNumerico, MAX_DIAS_ENTREGA } from '../../src/domain/value-objects/cobro-producto.vo';
import { generarContrato, PORCENTAJE_COMISION } from '../../src/domain/value-objects/contrato-compraventa.vo';
import { PedidosUseCase, EstadoCompraProductoUseCase, ConfigurarCobroUseCase, Solicitante } from '../../src/application/m16-pedidos/pedidos.use-cases';
import { CORREO_CUENTA_EJEMPLO } from '../../src/domain/value-objects/cobro-producto.vo';

// M-16 · Compra directa: comprador paga al vendedor (Yape/Plin/cuenta), el vendedor confirma y envía, el comprador confirma la recepción.
// HampiYura no custodia dinero: solo registra el contrato, el comprobante y la línea de tiempo, y media en reclamos.
const AHORA = new Date('2026-09-28T12:00:00Z');
const DIA = 24 * 3600_000;
const base = (over: Partial<PedidoProps> = {}): PedidoProps => ({
  id: 'p1', productoId: 'prod1', productoNombre: 'Jabón de sangre de grado', compradorId: 'comprador', vendedorId: 'vendedor',
  cantidad: 2, precioUnitario: 14, subtotal: 28, costoEnvio: 0, total: 28, comisionReferencial: 1.4,
  entregaNombre: 'Ana', entregaTelefono: '999111222', entregaDireccion: 'Jr. Los Pinos 123, Tingo María', entregaLatitud: -9.293, entregaLongitud: -75.997,
  cobro: { yape: '999888777' }, estado: 'PendientePago', entregaDias: 5, contratoVersion: 'v1', contratoTexto: 'texto',
  compradorAceptoEn: AHORA, vendedorCompromisoEn: AHORA, eventos: [{ estado: 'PendientePago', fecha: AHORA, actorId: 'comprador' }],
  creadoEn: AHORA, actualizadoEn: AHORA, ...over,
});

describe('Cobro de producto y precio', () => {
  test('exige al menos un medio de cobro y valida el celular peruano', () => {
    expect(() => validarCobro({ entregaDias: 5 })).toThrow(/al menos un medio/);
    expect(() => validarCobro({ yape: '123', entregaDias: 5 })).toThrow(/celular peruano/);
    expect(validarCobro({ yape: '999 888-777', entregaDias: 5 })).toEqual({ yape: '999888777', entregaDias: 5 });
  });
  test('el plazo de entrega debe ser de 1 a 30 días', () => {
    expect(() => validarCobro({ yape: '999888777', entregaDias: 0 })).toThrow(/plazo de entrega/);
    expect(() => validarCobro({ yape: '999888777', entregaDias: MAX_DIAS_ENTREGA + 1 })).toThrow(/plazo de entrega/);
  });
  test('precioNumerico lee un único número claro; precios ambiguos o sin número no son comprables', () => {
    expect(precioNumerico('S/ 14')).toBe(14);
    expect(precioNumerico('S/ 14.50')).toBe(14.5);
    expect(precioNumerico('14,50')).toBe(14.5);
    expect(precioNumerico('Consultar precio')).toBeUndefined();
    expect(precioNumerico(undefined)).toBeUndefined();
  });
});

describe('Contrato de compraventa', () => {
  test('incluye partes, precio, plazo de entrega, garantía de devolución íntegra y deja claro que HampiYura no custodia el dinero', () => {
    const texto = generarContrato({ fecha: AHORA, comprador: { nombre: 'Ana' }, vendedor: { nombre: 'Beto' }, producto: { nombre: 'Jabón' }, cantidad: 2, precioUnitario: 14, subtotal: 28, costoEnvio: 0, entregaDias: 5, medios: ['Yape'] });
    expect(texto).toMatch(/Ana/); expect(texto).toMatch(/Beto/); expect(texto).toMatch(/S\/ 28\.00/); expect(texto).toMatch(/5 días/);
    expect(texto).toMatch(/devolver el monto pagado de forma ÍNTEGRA/);
    expect(texto).toMatch(/NO es parte de la compraventa, NO custodia el dinero/);
    expect(texto).toMatch(new RegExp(`comisión de ${PORCENTAJE_COMISION}%`));
  });
});

describe('Pedido · máquina de estados', () => {
  test('flujo feliz completo: pago -> confirmar -> enviar -> recibido', () => {
    const p = new Pedido(base());
    p.informarPago('comprador', 'Yape', '/uploads/comprobante.png', '123456', AHORA);
    expect(p.props.estado).toBe('PagoInformado');
    p.confirmarPago('vendedor', new Date(AHORA.getTime() + DIA));
    expect(p.props.estado).toBe('PagoConfirmado');
    expect(p.props.fechaLimiteEntrega!.getTime()).toBe(AHORA.getTime() + DIA + 5 * DIA);
    p.marcarEnviado('vendedor', 'Enviado por Olva Courier, guía 12345', new Date(AHORA.getTime() + 2 * DIA));
    expect(p.props.estado).toBe('Enviado');
    p.confirmarRecepcion('comprador', new Date(AHORA.getTime() + 3 * DIA));
    expect(p.props.estado).toBe('Recibido');
    expect(p.props.eventos).toHaveLength(5);
  });
  test('solo el comprador informa el pago; solo con un medio que el vendedor acepta; solo con comprobante subido a la plataforma', () => {
    const p = new Pedido(base());
    expect(() => p.informarPago('vendedor', 'Yape', '/uploads/x.png', undefined)).toThrow(/Solo el comprador/);
    expect(() => p.informarPago('comprador', 'Plin', '/uploads/x.png', undefined)).toThrow(/no cobra por Plin/);
    expect(() => p.informarPago('comprador', 'Yape', 'https://otro-sitio.com/x.png', undefined)).toThrow(/Sube la captura/);
  });
  test('el vendedor puede rechazar el pago y el comprador vuelve a informarlo', () => {
    const p = new Pedido(base());
    p.informarPago('comprador', 'Yape', '/uploads/a.png', undefined, AHORA);
    p.rechazarPago('vendedor', 'El monto no coincide', new Date(AHORA.getTime() + DIA));
    expect(p.props.estado).toBe('PagoRechazado'); expect(p.props.motivoRechazoPago).toBe('El monto no coincide');
    p.informarPago('comprador', 'Yape', '/uploads/b.png', undefined, new Date(AHORA.getTime() + 2 * DIA));
    expect(p.props.estado).toBe('PagoInformado');
  });
  test('solo el vendedor confirma/rechaza el pago y marca el envío; solo dentro del estado correcto', () => {
    const p = new Pedido(base());
    expect(() => p.confirmarPago('vendedor')).toThrow(/no corresponde al estado actual/);
    p.informarPago('comprador', 'Yape', '/uploads/a.png', undefined, AHORA);
    expect(() => p.confirmarPago('comprador')).toThrow(/Solo el vendedor/);
    expect(() => p.marcarEnviado('vendedor', 'x'.repeat(10))).toThrow(/no corresponde al estado actual/);
  });
  test('reclamo: no se puede antes de vencer el plazo (sin envío), sí después de vencido o si ya se envió; solo el administrador resuelve', () => {
    const p = new Pedido(base());
    p.informarPago('comprador', 'Yape', '/uploads/a.png', undefined, AHORA);
    p.confirmarPago('vendedor', AHORA);
    expect(() => p.abrirReclamo('comprador', 'No ha llegado nada')).toThrow(/dentro del plazo de entrega/);
    p.abrirReclamo('comprador', 'No ha llegado nada, ya pasó el plazo', new Date(AHORA.getTime() + 6 * DIA));
    expect(p.props.estado).toBe('Reclamo');
    expect(() => p.resolverReclamo('vendedor', 'Se le devolvió el dinero')).not.toThrow(); // la autorización de rol la hace el caso de uso, no la entidad
    expect(p.props.estado).toBe('Cerrado');
  });
  test('reclamo también procede si el vendedor YA marcó enviado, sin esperar el vencimiento', () => {
    const p = new Pedido(base());
    p.informarPago('comprador', 'Yape', '/uploads/a.png', undefined, AHORA);
    p.confirmarPago('vendedor', AHORA);
    p.marcarEnviado('vendedor', 'Enviado por courier', new Date(AHORA.getTime() + DIA));
    expect(() => p.abrirReclamo('comprador', 'El producto llegó dañado', new Date(AHORA.getTime() + 2 * DIA))).not.toThrow();
  });
  test('el comprador cancela solo antes de que el vendedor confirme el pago', () => {
    const p = new Pedido(base());
    p.cancelar('comprador'); expect(p.props.estado).toBe('Cancelado');
    const p2 = new Pedido(base({ id: 'p2' }));
    p2.informarPago('comprador', 'Yape', '/uploads/a.png', undefined); p2.confirmarPago('vendedor');
    expect(() => p2.cancelar('comprador')).toThrow(/no corresponde al estado actual/);
  });
  test('plazoVencido() compara contra fechaLimiteEntrega', () => {
    const p = new Pedido(base({ estado: 'PagoConfirmado', fechaLimiteEntrega: new Date(AHORA.getTime() + DIA) }));
    expect(p.plazoVencido(AHORA)).toBe(false);
    expect(p.plazoVencido(new Date(AHORA.getTime() + 2 * DIA))).toBe(true);
  });
});

function repos() {
  const productos: any = {};
  const cobros = new Map<string, any>();
  const usuarios: any = {};
  const pedidosMem: any[] = [];
  const notificaciones: { destinoId: string; tipo: string; mensaje?: string }[] = [];
  const productoRepo = {
    buscarPorId: async (id: string) => productos[id] ?? null,
    actualizar: async () => {}, // el mock ya es el mismo objeto en memoria (descontarStock muta sus props directamente)
  };
  const cobroRepo = {
    obtener: async (id: string) => cobros.get(id) ?? null,
    guardar: async (c: any) => { cobros.set(c.productoId, c); },
  };
  const usuarioRepo = { buscarPorId: async (id: string) => usuarios[id] ?? null };
  const notificador = { notificar: async (destinoId: string, tipo: string, ref?: any) => { notificaciones.push({ destinoId, tipo, mensaje: ref?.mensaje }); } };
  const pedidoRepo = {
    guardar: async (p: Pedido) => { pedidosMem.push(p); },
    actualizar: async (_p: Pedido) => {},
    buscarPorId: async (id: string) => pedidosMem.find((p) => p.props.id === id) ?? null,
    listarDe: async (usuarioId: string, rol: 'comprador' | 'vendedor') => pedidosMem.filter((p) => (rol === 'comprador' ? p.props.compradorId : p.props.vendedorId) === usuarioId),
    listarPorEstado: async (estado: string) => pedidosMem.filter((p) => p.props.estado === estado),
  };
  const prod = (id: string, over: any = {}) => {
    const props = { id, productorId: 'vendedor', nombre: 'Jabón de sangre de grado', precioReferencial: 'S/ 14', stockDisponible: null, ...over };
    productos[id] = {
      esVisiblePublicamente: () => true, props,
      hayStockPara: (c: number) => props.stockDisponible == null || props.stockDisponible >= c,
      descontarStock: (c: number) => { if (props.stockDisponible != null) props.stockDisponible = Math.max(0, props.stockDisponible - c); },
      fijarStock: (u: number | null) => { if (u !== null && (!Number.isInteger(u) || u < 0)) throw new Error('El stock debe ser un número entero de 0 a más, o vacío para no gestionarlo'); props.stockDisponible = u; },
    };
  };
  const user = (id: string, over: any = {}) => { usuarios[id] = { props: { id, nombre: id, correo: `${id}@x.com`, estado: 'Activo', rol: 'UsuarioRegistrado', ...over } }; };
  return { productoRepo, cobroRepo, usuarioRepo, pedidoRepo, notificador, notificaciones, prod, user, cobros };
}

function armarPedidosUC() {
  const r = repos();
  r.prod('prod1'); r.user('comprador', { nombre: 'Ana' }); r.user('vendedor', { nombre: 'Beto', nombreNegocio: 'Huerta Beto' });
  r.cobros.set('prod1', { productoId: 'prod1', yape: '999888777', entregaDias: 5, compromisoEn: AHORA });
  const uc = new PedidosUseCase(r.pedidoRepo as any, r.productoRepo as any, r.cobroRepo as any, r.usuarioRepo as any, r.notificador as any);
  return { uc, r };
}
const entrega = { nombre: 'Ana', telefono: '999111222', direccion: 'Jr. Los Pinos 123, Tingo María', latitud: -9.3, longitud: -76.0 };

describe('Casos de uso de pedidos', () => {
  test('EstadoCompraProductoUseCase: sin cobro configurado, sin precio claro, o de la cuenta de ejemplo -> no comprable, sin exponer los números', async () => {
    const r = repos(); r.prod('prod1'); r.user('vendedor');
    const uc = new EstadoCompraProductoUseCase(r.productoRepo as any, r.cobroRepo as any, r.usuarioRepo as any);
    expect((await uc.ejecutar('prod1')).motivo).toMatch(/no registró cómo cobrar/);
    await r.cobroRepo.guardar({ productoId: 'prod1', yape: '999888777', entregaDias: 5, compromisoEn: AHORA });
    const ok = await uc.ejecutar('prod1');
    expect(ok.comprable).toBe(true); expect(JSON.stringify(ok)).not.toMatch(/999888777/); expect(ok.medios).toEqual(['Yape']);

    r.prod('prodSinPrecio', { precioReferencial: 'Consultar' }); await r.cobroRepo.guardar({ productoId: 'prodSinPrecio', yape: '999888777', entregaDias: 5, compromisoEn: AHORA });
    expect((await uc.ejecutar('prodSinPrecio')).motivo).toMatch(/precio claro/);

    r.prod('prodDemo', { productorId: 'demo' }); r.user('demo', { correo: CORREO_CUENTA_EJEMPLO }); await r.cobroRepo.guardar({ productoId: 'prodDemo', yape: '999888777', entregaDias: 5, compromisoEn: AHORA });
    const demo = await uc.ejecutar('prodDemo');
    expect(demo.comprable).toBe(false); expect(demo.esDemostracion).toBe(true); expect(demo.motivo).toMatch(/demostración/);
  });

  test('ConfigurarCobroUseCase: solo el dueño del producto configura, y exige aceptar el compromiso de entrega', async () => {
    const r = repos(); r.prod('prod1');
    const uc = new ConfigurarCobroUseCase(r.productoRepo as any, r.cobroRepo as any);
    await expect(uc.ejecutar({ id: 'otro', rol: 'UsuarioRegistrado' }, 'prod1', { yape: '999888777', entregaDias: 5, aceptaCompromiso: true })).rejects.toThrow(/Solo quien publicó/);
    await expect(uc.ejecutar({ id: 'vendedor', rol: 'UsuarioRegistrado' }, 'prod1', { yape: '999888777', entregaDias: 5 })).rejects.toThrow(/Debes aceptar el compromiso/);
    await uc.ejecutar({ id: 'vendedor', rol: 'UsuarioRegistrado' }, 'prod1', { yape: '999888777', entregaDias: 5, aceptaCompromiso: true });
    expect(r.cobros.get('prod1')).toMatchObject({ yape: '999888777', entregaDias: 5 });
  });

  test('crear pedido: exige datos de entrega válidos y aceptar el contrato; calcula el total y la comisión; notifica al vendedor', async () => {
    const { uc, r } = armarPedidosUC();
    await expect(uc.crear('comprador', { productoId: 'prod1', cantidad: 2, entrega: { nombre: 'A', telefono: '999', direccion: 'x' }, aceptaContrato: true })).rejects.toThrow(/nombre de quien recibe/);
    await expect(uc.crear('comprador', { productoId: 'prod1', cantidad: 2, entrega, aceptaContrato: false })).rejects.toThrow(/aceptar el contrato/);
    const p = await uc.crear('comprador', { productoId: 'prod1', cantidad: 2, entrega, aceptaContrato: true }, AHORA);
    expect(p.props.total).toBe(28); expect(p.props.comisionReferencial).toBe(1.4); expect(p.props.contratoTexto).toMatch(/Ana/);
    expect(r.notificaciones).toContainEqual(expect.objectContaining({ destinoId: 'vendedor', tipo: 'pedido_nuevo' }));
  });
  test('no se puede comprar el propio producto, ni un producto de la cuenta de ejemplo', async () => {
    const { uc, r } = armarPedidosUC();
    await expect(uc.crear('vendedor', { productoId: 'prod1', cantidad: 1, entrega, aceptaContrato: true })).rejects.toThrow(/propio producto/);
    r.prod('prodDemo', { productorId: 'demo' }); r.user('demo', { correo: CORREO_CUENTA_EJEMPLO }); r.cobros.set('prodDemo', { productoId: 'prodDemo', yape: '999888777', entregaDias: 5, compromisoEn: AHORA });
    await expect(uc.crear('comprador', { productoId: 'prodDemo', cantidad: 1, entrega, aceptaContrato: true })).rejects.toThrow(/demostración/);
  });
  test('cantidad fuera de rango se rechaza', async () => {
    const { uc } = armarPedidosUC();
    await expect(uc.crear('comprador', { productoId: 'prod1', cantidad: 0, entrega, aceptaContrato: true })).rejects.toThrow(/cantidad/i);
    await expect(uc.crear('comprador', { productoId: 'prod1', cantidad: 21, entrega, aceptaContrato: true })).rejects.toThrow(/cantidad/i);
  });
  test('vistaPrevia no crea nada y devuelve el mismo contrato/total que crear', async () => {
    const { uc, r } = armarPedidosUC();
    const previa = await uc.vistaPrevia('comprador', { productoId: 'prod1', cantidad: 2, entrega }, AHORA);
    expect(previa.total).toBe(28); expect(previa.contrato).toMatch(/Ana/);
    expect((await r.pedidoRepo.listarDe('comprador', 'comprador')).length).toBe(0);
  });

  test('un tercero no puede ver ni actuar sobre el pedido; el mismo error para "no existe" y "no es tuyo"', async () => {
    const { uc } = armarPedidosUC();
    const p = await uc.crear('comprador', { productoId: 'prod1', cantidad: 1, entrega, aceptaContrato: true }, AHORA);
    const tercero: Solicitante = { id: 'x', rol: 'UsuarioRegistrado' };
    await expect(uc.obtener(tercero, p.props.id)).rejects.toThrow(/no encontrado/i);
    await expect(uc.obtener(tercero, 'no-existe')).rejects.toThrow(/no encontrado/i);
    await expect(uc.confirmarPago(tercero, p.props.id)).rejects.toThrow();
  });
  test('el comprador ve los números de cobro para pagar; el administrador ve el pedido pero no los números', async () => {
    const { uc } = armarPedidosUC();
    const p = await uc.crear('comprador', { productoId: 'prod1', cantidad: 1, entrega, aceptaContrato: true }, AHORA);
    const vista = await uc.obtener({ id: 'comprador', rol: 'UsuarioRegistrado' }, p.props.id);
    expect(vista.cobro).toEqual({ yape: '999888777' });
    const vistaAdmin = await uc.obtener({ id: 'admin1', rol: 'Administrador' }, p.props.id);
    expect(vistaAdmin.cobro).toBeUndefined();
  });
  test('acciones disponibles reflejan el estado y el rol de quien pregunta', async () => {
    const { uc } = armarPedidosUC();
    const p = await uc.crear('comprador', { productoId: 'prod1', cantidad: 1, entrega, aceptaContrato: true }, AHORA);
    const comprador = { id: 'comprador', rol: 'UsuarioRegistrado' };
    expect((await uc.obtener(comprador, p.props.id)).acciones).toEqual(expect.arrayContaining(['informarPago', 'cancelar']));
    await uc.informarPago(comprador, p.props.id, 'Yape', '/uploads/x.png');
    const vendedor = { id: 'vendedor', rol: 'UsuarioRegistrado' };
    expect((await uc.obtener(vendedor, p.props.id)).acciones).toEqual(expect.arrayContaining(['confirmarPago', 'rechazarPago']));
  });
  test('solo el administrador ve/lista/resuelve reclamos', async () => {
    const { uc } = armarPedidosUC();
    await expect(uc.listarReclamos({ id: 'comprador', rol: 'UsuarioRegistrado' })).rejects.toThrow(/administrador/);
    const p = await uc.crear('comprador', { productoId: 'prod1', cantidad: 1, entrega, aceptaContrato: true }, AHORA);
    await uc.informarPago({ id: 'comprador', rol: 'UsuarioRegistrado' }, p.props.id, 'Yape', '/uploads/x.png', undefined, AHORA);
    await uc.confirmarPago({ id: 'vendedor', rol: 'UsuarioRegistrado' }, p.props.id, AHORA);
    await uc.abrirReclamo({ id: 'comprador', rol: 'UsuarioRegistrado' }, p.props.id, 'No llegó, ya venció el plazo', new Date(AHORA.getTime() + 6 * DIA));
    await expect(uc.resolverReclamo({ id: 'comprador', rol: 'UsuarioRegistrado' }, p.props.id, 'x'.repeat(15))).rejects.toThrow(/administrador/);
    const reclamos = await uc.listarReclamos({ id: 'admin1', rol: 'Administrador' });
    expect(reclamos).toHaveLength(1);
    await uc.resolverReclamo({ id: 'admin1', rol: 'Administrador' }, p.props.id, 'Se verificó con el vendedor: reembolsó el monto íntegro');
    expect((await uc.obtener({ id: 'admin1', rol: 'Administrador' }, p.props.id)).estado).toBe('Cerrado');
  });
});

describe('Ronda 36 · Stock real (baja solo al confirmar el pago)', () => {
  test('sin stock gestionado (null), se puede pedir cualquier cantidad razonable', async () => {
    const { uc } = armarPedidosUC();
    const p = await uc.crear('comprador', { productoId: 'prod1', cantidad: 5, entrega, aceptaContrato: true }, AHORA);
    expect(p.props.cantidad).toBe(5);
  });
  test('no se puede pedir más de lo que hay; con stock en 0, "sin stock disponible"', async () => {
    const { uc, r } = armarPedidosUC();
    (await r.productoRepo.buscarPorId('prod1')).props.stockDisponible = 2;
    await expect(uc.crear('comprador', { productoId: 'prod1', cantidad: 3, entrega, aceptaContrato: true }, AHORA)).rejects.toThrow(/Solo quedan 2 unidad/);
    (await r.productoRepo.buscarPorId('prod1')).props.stockDisponible = 0;
    await expect(uc.crear('comprador', { productoId: 'prod1', cantidad: 1, entrega, aceptaContrato: true }, AHORA)).rejects.toThrow(/Sin stock disponible/);
  });
  test('el stock NO baja al pedir ni al informar el pago; baja SOLO cuando el vendedor confirma, y nunca queda negativo', async () => {
    const { uc, r } = armarPedidosUC();
    (await r.productoRepo.buscarPorId('prod1')).props.stockDisponible = 5;
    const p = await uc.crear('comprador', { productoId: 'prod1', cantidad: 3, entrega, aceptaContrato: true }, AHORA);
    expect((await r.productoRepo.buscarPorId('prod1')).props.stockDisponible).toBe(5); // sin cambios al pedir
    await uc.informarPago({ id: 'comprador', rol: 'UsuarioRegistrado' }, p.props.id, 'Yape', '/uploads/x.png');
    expect((await r.productoRepo.buscarPorId('prod1')).props.stockDisponible).toBe(5); // sin cambios al informar
    await uc.confirmarPago({ id: 'vendedor', rol: 'UsuarioRegistrado' }, p.props.id);
    expect((await r.productoRepo.buscarPorId('prod1')).props.stockDisponible).toBe(2); // baja recién aquí
    const p2 = await uc.crear('comprador', { productoId: 'prod1', cantidad: 2, entrega, aceptaContrato: true }, AHORA);
    await uc.informarPago({ id: 'comprador', rol: 'UsuarioRegistrado' }, p2.props.id, 'Yape', '/uploads/y.png');
    await uc.confirmarPago({ id: 'vendedor', rol: 'UsuarioRegistrado' }, p2.props.id);
    expect((await r.productoRepo.buscarPorId('prod1')).props.stockDisponible).toBe(0);
  });
});

describe('Ronda 36 · EstadoCompraProductoUseCase y ConfigurarCobroUseCase con stock', () => {
  test('estado-compra muestra el stock público y bloquea con "Sin stock disponible" cuando llega a 0', async () => {
    const r = repos(); r.prod('prod1', { stockDisponible: 0 }); r.user('vendedor'); await r.cobroRepo.guardar({ productoId: 'prod1', yape: '999888777', entregaDias: 5, compromisoEn: AHORA });
    const uc = new EstadoCompraProductoUseCase(r.productoRepo as any, r.cobroRepo as any, r.usuarioRepo as any);
    const e = await uc.ejecutar('prod1');
    expect(e).toMatchObject({ comprable: false, motivo: 'Sin stock disponible por ahora.', stockDisponible: 0 });
  });
  test('solo el dueño del producto puede fijar el stock, y debe ser un entero válido (o null para dejar de gestionarlo)', async () => {
    const r = repos(); r.prod('prod1');
    const uc = new ConfigurarCobroUseCase(r.productoRepo as any, r.cobroRepo as any);
    await expect(uc.fijarStock({ id: 'otro', rol: 'UsuarioRegistrado' }, 'prod1', 10)).rejects.toThrow(/Solo quien public/);
    await expect(uc.fijarStock({ id: 'vendedor', rol: 'UsuarioRegistrado' }, 'prod1', -1)).rejects.toThrow(/entero/);
    await uc.fijarStock({ id: 'vendedor', rol: 'UsuarioRegistrado' }, 'prod1', 10);
    expect((await r.productoRepo.buscarPorId('prod1')).props.stockDisponible).toBe(10);
    await uc.fijarStock({ id: 'vendedor', rol: 'UsuarioRegistrado' }, 'prod1', null);
    expect((await r.productoRepo.buscarPorId('prod1')).props.stockDisponible).toBeNull();
  });
});

describe('Ronda 37 · Envío calculado por distancia GPS', () => {
  test('sin coordenadas del producto (el vendedor no marcó su ubicación), el envío no se calcula: costo 0, sin distancia', async () => {
    const { uc } = armarPedidosUC(); // prod1 no tiene latitud/longitud
    const p = await uc.crear('comprador', { productoId: 'prod1', cantidad: 2, entrega, aceptaContrato: true }, AHORA);
    expect(p.props.costoEnvio).toBe(0); expect(p.props.distanciaKm).toBeUndefined(); expect(p.props.total).toBe(p.props.subtotal);
    expect(p.props.contratoTexto).toMatch(/No se pudo calcular por distancia/);
  });
  test('con coordenadas de ambos lados, calcula la distancia real (Haversine) y el costo S\\/5 base + S\\/0.5\\/km', async () => {
    const { uc, r } = armarPedidosUC();
    r.prod('prod1', { latitud: -9.293, longitud: -75.997 }); // Tingo María aprox.
    const cercana = { ...entrega, latitud: -9.30, longitud: -76.00 }; // pocos km de distancia
    const p = await uc.crear('comprador', { productoId: 'prod1', cantidad: 1, entrega: cercana, aceptaContrato: true }, AHORA);
    expect(p.props.distanciaKm).toBeGreaterThan(0);
    expect(p.props.costoEnvio).toBeCloseTo(5 + 0.5 * p.props.distanciaKm!, 2);
    expect(p.props.total).toBeCloseTo(p.props.subtotal + p.props.costoEnvio, 2);
    expect(p.props.contratoTexto).toMatch(/Costo de envío: S\/ \d+\.\d{2} \(calculado por la distancia real/);
  });
  test('sin marcar la ubicación en el mapa, no se puede crear el pedido', async () => {
    const { uc } = armarPedidosUC();
    const sinUbicacion: any = { nombre: 'Ana', telefono: '999111222', direccion: 'Jr. Los Pinos 123, Tingo María' };
    await expect(uc.crear('comprador', { productoId: 'prod1', cantidad: 1, entrega: sinUbicacion, aceptaContrato: true }, AHORA)).rejects.toThrow(/Marca tu ubicación/);
  });
  test('envío largo (>15 km): exige un punto de referencia, y no hay ninguna búsqueda automática de "paradero"', async () => {
    const { uc, r } = armarPedidosUC();
    r.prod('prod1', { latitud: -9.293, longitud: -75.997 });
    const lejos = { ...entrega, latitud: -8.0, longitud: -76.0 }; // ~140 km
    await expect(uc.crear('comprador', { productoId: 'prod1', cantidad: 1, entrega: lejos, aceptaContrato: true }, AHORA)).rejects.toThrow(/punto de referencia/);
    const p = await uc.crear('comprador', { productoId: 'prod1', cantidad: 1, entrega: { ...lejos, referencia: 'Paradero de la plaza de armas' }, aceptaContrato: true }, AHORA);
    expect(p.props.entregaReferencia).toBe('Paradero de la plaza de armas');
    expect(p.props.distanciaKm).toBeGreaterThan(15);
  });
  test('vistaPrevia expone envioLargo y el desglose subtotal/envío/total sin crear nada', async () => {
    const { uc, r } = armarPedidosUC();
    r.prod('prod1', { latitud: -9.293, longitud: -75.997 });
    const lejos = { ...entrega, latitud: -8.0, longitud: -76.0 };
    const previa = await uc.vistaPrevia('comprador', { productoId: 'prod1', cantidad: 1, entrega: lejos }, AHORA);
    expect(previa.envioLargo).toBe(true);
    expect(previa.total).toBeCloseTo(previa.subtotal + previa.costoEnvio, 2);
  });
});
