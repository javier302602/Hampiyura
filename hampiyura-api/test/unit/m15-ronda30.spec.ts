import { PagoContacto } from '../../src/domain/entities/pago-contacto.entity';
import { AccesoContactoService, SolicitarPagoUseCase } from '../../src/application/m15-planes/planes.use-cases';
import { MensajeriaUseCase } from '../../src/application/m15-planes/mensajeria.use-cases';
import { AlertasUseCase } from '../../src/application/m15-planes/alertas.use-cases';
import { ReporteBioeconomiaUseCase, UMBRAL_MINIMO } from '../../src/application/m15-planes/reportes.use-cases';
import { ProductoresDisponiblesUseCase, DIAS_DISPONIBILIDAD } from '../../src/application/m15-planes/productores-disponibles.use-cases';
import { CATALOGO_PLANES, precioDe } from '../../src/domain/value-objects/plan.vo';

const DIA = 24 * 60 * 60 * 1000;
const AHORA = new Date('2026-09-26T12:00:00Z');
function pago(over: Partial<PagoContacto['props']> = {}) {
  const p = new PagoContacto({ id: Math.random().toString(36).slice(2), usuarioId: 'u1', concepto: 'Plan', plan: 'Negocio', monto: 29, metodo: 'Yape', comprobanteUrl: '/uploads/a.png', estado: 'Pendiente', creadoEn: AHORA, ...over });
  return p;
}
const confirmado = (over: Partial<PagoContacto['props']> = {}, cuando = new Date(AHORA.getTime() - 2 * DIA)) => { const p = pago(over); p.confirmar('admin', cuando); return p; };
function repoPagos(memoria: PagoContacto[]): any {
  return { guardar: async (p: PagoContacto) => { memoria.push(p); }, actualizar: async () => {}, buscarPorId: async (id: string) => memoria.find((p) => p.props.id === id) ?? null,
    listarPorUsuario: async (u: string) => memoria.filter((p) => p.props.usuarioId === u), listar: async (e?: string) => memoria.filter((p) => !e || p.props.estado === e) };
}
const usuariosFake = (lista: { id: string; rol: string; nombre?: string }[]): any => ({
  buscarPorId: async (id: string) => { const u = lista.find((x) => x.id === id); return u ? { props: { id, rol: u.rol, nombre: u.nombre ?? id, estado: 'Activo' } } : null; },
  listar: async () => lista.map((u) => ({ props: { id: u.id, rol: u.rol, nombre: u.nombre ?? u.id, estado: 'Activo' } })),
});
const notificadorFake = () => { const enviados: { usuarioId: string; tipo: string; mensaje?: string }[] = []; return { enviados, notificar: async (usuarioId: string, tipo: string, ref?: any) => { enviados.push({ usuarioId, tipo, mensaje: ref?.mensaje }); } }; };

describe('Ronda 30 · catálogo de planes', () => {
  test('ningún plan dice "Próximamente": Negocio incluye mensajería y alertas; Institucional incluye los reportes', () => {
    for (const p of CATALOGO_PLANES) expect(p.proximamente).toEqual([]);
    const negocio = CATALOGO_PLANES.find((p) => p.id === 'Negocio')!.incluye.join(' | ');
    expect(negocio).toMatch(/Mensajería directa/); expect(negocio).toMatch(/Alertas de disponibilidad y de temporada/);
    expect(CATALOGO_PLANES.find((p) => p.id === 'Institucional')!.incluye.join(' | ')).toMatch(/Reportes y datos agregados/);
  });
  test('Premium es un complemento de S/ 19 al mes (no un nivel de la escalera)', () => {
    const premium = CATALOGO_PLANES.find((p) => p.id === 'Premium')!;
    expect(premium.precio).toBe(19); expect(premium.complemento).toBe(true); expect(precioDe('Premium')).toBe(19);
  });
});

describe('Ronda 30 · complemento Premium y "Productores disponibles"', () => {
  test('el acceso exige Premium vigente ENCIMA de un plan base vigente (el administrador entra siempre)', async () => {
    const memoria: PagoContacto[] = []; const acceso = new AccesoContactoService(repoPagos(memoria));
    const c = { id: 'c', rol: 'UsuarioRegistrado' };
    expect((await acceso.puedeVerProductoresDisponibles(undefined)).permitido).toBe(false);
    expect((await acceso.puedeVerProductoresDisponibles(c, AHORA)).permitido).toBe(false); // sin nada
    memoria.push(confirmado({ usuarioId: 'c', plan: 'Negocio' }));
    expect((await acceso.puedeVerProductoresDisponibles(c, AHORA)).motivo).toMatch(/Premium/); // plan base sin Premium
    memoria.push(confirmado({ usuarioId: 'c', plan: 'Premium', monto: 19 }));
    expect((await acceso.puedeVerProductoresDisponibles(c, AHORA)).permitido).toBe(true);
    expect((await acceso.puedeVerProductoresDisponibles(c, new Date(AHORA.getTime() + 40 * DIA))).permitido).toBe(false); // ambos vencidos
    expect((await acceso.puedeVerProductoresDisponibles({ id: 'a', rol: 'Administrador' })).permitido).toBe(true);
  });
  test('Premium solo, sin plan base vigente, no basta ni cuenta como plan (no da contactos)', async () => {
    const acceso = new AccesoContactoService(repoPagos([confirmado({ usuarioId: 'c', plan: 'Premium', monto: 19 })]));
    expect((await acceso.puedeVerProductoresDisponibles({ id: 'c', rol: 'UsuarioRegistrado' }, AHORA)).permitido).toBe(false);
    expect((await acceso.planActivo('c', AHORA)).plan).toBe('Explorador');
    expect(await acceso.puedeVerContacto({ id: 'c', rol: 'UsuarioRegistrado' }, 'prod1', AHORA)).toBe(false);
  });
  test('no se puede pedir Premium sin un plan base vigente; con uno sí, y el monto sale del servidor', async () => {
    const memoria: PagoContacto[] = []; const acceso = new AccesoContactoService(repoPagos(memoria));
    const uc = new SolicitarPagoUseCase(repoPagos(memoria), {} as any, acceso);
    const base = { usuarioId: 'c', rol: 'UsuarioRegistrado', concepto: 'Plan' as const, plan: 'Premium', metodo: 'Yape', comprobanteUrl: '/uploads/x.png' };
    await expect(uc.ejecutar(base)).rejects.toThrow(/complemento/i);
    memoria.push(confirmado({ usuarioId: 'c', plan: 'Empresarial', monto: 99 }));
    const p = await uc.ejecutar(base);
    expect(p.props.monto).toBe(19); expect(p.props.plan).toBe('Premium');
  });

  function armarDisponibles() {
    const memoria: PagoContacto[] = [confirmado({ usuarioId: 'comprador', plan: 'Negocio' }), confirmado({ usuarioId: 'comprador', plan: 'Premium', monto: 19 })];
    const acceso = new AccesoContactoService(repoPagos(memoria));
    const marcas = new Map<string, { hasta: Date; nota?: string }>();
    const repo: any = {
      establecer: async (id: string, hasta: Date | null, nota?: string) => { if (hasta) marcas.set(id, { hasta, nota }); else marcas.delete(id); },
      obtener: async (id: string) => (marcas.has(id) ? { productorId: id, ...marcas.get(id)! } : null),
      listarVigentes: async (ahora: Date) => [...marcas].filter(([, v]) => v.hasta > ahora).map(([productorId, v]) => ({ productorId, ...v })),
    };
    const contactable = (id: string, extra: any = {}) => ({ id, nombre: id, region: 'Tingo María', plantas: ['Uña de gato'], zonas: ['Leoncio Prado, Huánuco'], zonasProducto: [], certificado: false, tiposProductor: ['Campesino'], ...extra });
    const directorio: any = { todos: async () => [contactable('prodA'), contactable('prodB', { plantas: ['Sacha inchi'], zonas: ['Tocache, San Martín'], tiposProductor: ['Comunidad'] }), contactable('prodC')], esContactable: async (id: string) => ['prodA', 'prodB', 'prodC'].includes(id) };
    return { uc: new ProductoresDisponiblesUseCase(repo, directorio, acceso), marcas };
  }
  test('solo un Productor contactable puede marcarse disponible; la marca vence sola a los 7 días', async () => {
    const { uc } = armarDisponibles();
    await expect(uc.marcar({ id: 'comprador', rol: 'UsuarioRegistrado' }, true)).rejects.toThrow(/Productor/);
    await expect(uc.marcar({ id: 'prodX', rol: 'Productor' }, true, undefined, AHORA)).rejects.toThrow(/ficha de cultivo validada/);
    const r = await uc.marcar({ id: 'prodA', rol: 'Productor' }, true, 'Tengo cosecha', AHORA);
    expect(r.disponibleHasta!.getTime() - AHORA.getTime()).toBe(DIAS_DISPONIBILIDAD * DIA);
    const c = { id: 'comprador', rol: 'UsuarioRegistrado' };
    expect((await uc.listar(c, {}, AHORA)).productores.map((p) => p.id)).toEqual(['prodA']);
    expect((await uc.listar(c, {}, new Date(AHORA.getTime() + 8 * DIA))).productores).toEqual([]); // venció
  });
  test('la lista está bloqueada sin Premium y se filtra por planta, zona y tipo', async () => {
    const { uc } = armarDisponibles();
    await uc.marcar({ id: 'prodA', rol: 'Productor' }, true, undefined, AHORA); await uc.marcar({ id: 'prodB', rol: 'Productor' }, true, undefined, AHORA);
    await expect(uc.listar({ id: 'otro', rol: 'UsuarioRegistrado' }, {}, AHORA)).rejects.toThrow(/plan|Premium/i);
    const c = { id: 'comprador', rol: 'UsuarioRegistrado' };
    expect((await uc.listar(c, { planta: 'sacha' }, AHORA)).productores.map((p) => p.id)).toEqual(['prodB']);
    expect((await uc.listar(c, { zona: 'leoncio' }, AHORA)).productores.map((p) => p.id)).toEqual(['prodA']);
    expect((await uc.listar(c, { tipo: 'Comunidad' }, AHORA)).productores.map((p) => p.id)).toEqual(['prodB']);
    const todo = await uc.listar(c, {}, AHORA);
    expect(todo.opciones.tipos).toEqual(['Campesino', 'Comunidad']);
  });
  test('la respuesta no trae contacto, teléfono ni coordenadas', async () => {
    const { uc } = armarDisponibles(); await uc.marcar({ id: 'prodA', rol: 'Productor' }, true, undefined, AHORA);
    const json = JSON.stringify(await uc.listar({ id: 'comprador', rol: 'UsuarioRegistrado' }, {}, AHORA));
    expect(json).not.toMatch(/telefono|contacto|latitud|longitud/i);
  });
});

describe('Ronda 30 · mensajería directa (plan Negocio)', () => {
  function armar(plan: 'Negocio' | null = 'Negocio') {
    const memoria: PagoContacto[] = plan ? [confirmado({ usuarioId: 'comprador', plan })] : [];
    const acceso = new AccesoContactoService(repoPagos(memoria));
    const convs: any[] = []; const msgs: any[] = [];
    const repo: any = {
      buscarConversacion: async (c: string, p: string) => convs.find((x) => x.compradorId === c && x.productorId === p) ?? null,
      buscarConversacionPorId: async (id: string) => convs.find((x) => x.id === id) ?? null,
      crearConversacion: async (c: any) => { convs.push(c); },
      listarConversacionesDe: async (u: string) => convs.filter((x) => x.compradorId === u || x.productorId === u),
      listarMensajes: async (id: string) => msgs.filter((m) => m.conversacionId === id),
      guardarMensaje: async (m: any) => { msgs.push(m); },
      marcarLeidos: async (id: string, lector: string, ahora: Date) => msgs.filter((m) => m.conversacionId === id && m.autorId !== lector && !m.leidoEn).forEach((m) => { m.leidoEn = ahora; }),
      contarMensajesDesde: async (a: string) => msgs.filter((m) => m.autorId === a).length,
    };
    const directorio: any = { esContactable: async (id: string) => id === 'prod1' };
    const n = notificadorFake();
    const uc = new MensajeriaUseCase(repo, usuariosFake([{ id: 'comprador', rol: 'UsuarioRegistrado', nombre: 'Compradora' }, { id: 'prod1', rol: 'Productor', nombre: 'Ana' }, { id: 'intruso', rol: 'UsuarioRegistrado' }]), acceso, directorio, n);
    return { uc, n, msgs };
  }
  const comprador = { id: 'comprador', rol: 'UsuarioRegistrado' };
  test('sin plan de pago no se puede iniciar una conversación', async () => {
    const { uc } = armar(null);
    await expect(uc.escribirAProductor(comprador, 'prod1', 'Hola', AHORA)).rejects.toThrow(/plan Negocio/);
  });
  test('con plan Negocio se inicia; el productor contactable recibe la notificación y responde; el intruso no ve nada', async () => {
    const { uc, n } = armar();
    const { conversacionId } = await uc.escribirAProductor(comprador, 'prod1', '  ¿Tienes uña de gato seca?  ', AHORA);
    expect(n.enviados.at(-1)).toMatchObject({ usuarioId: 'prod1', tipo: 'mensaje_directo' });
    expect((await uc.listar('prod1'))[0]).toMatchObject({ sinLeer: 1, conTipo: 'comprador' });
    await uc.responder({ id: 'prod1', rol: 'Productor' }, conversacionId, 'Sí, 2 kilos', AHORA);
    const detalle = await uc.obtener('prod1', conversacionId, AHORA);
    expect(detalle.mensajes.map((m) => m.texto)).toEqual(['¿Tienes uña de gato seca?', 'Sí, 2 kilos']);
    expect((await uc.listar('prod1'))[0].sinLeer).toBe(0); // abrir la conversación marca como leído
    await expect(uc.obtener('intruso', conversacionId)).rejects.toThrow(/no encontrada/i);
    await expect(uc.responder({ id: 'intruso', rol: 'UsuarioRegistrado' }, conversacionId, 'hola')).rejects.toThrow(/no encontrada/i);
  });
  test('no se puede escribir a un productor no contactable, a uno mismo, ni mensajes vacíos o larguísimos', async () => {
    const { uc } = armar();
    await expect(uc.escribirAProductor(comprador, 'prodNoValidado', 'Hola', AHORA)).rejects.toThrow(/no está disponible/);
    await expect(uc.escribirAProductor({ id: 'prod1', rol: 'Productor' }, 'prod1', 'Hola', AHORA)).rejects.toThrow(/ti mismo/);
    await expect(uc.escribirAProductor(comprador, 'prod1', '   ', AHORA)).rejects.toThrow(/Escribe un mensaje/);
    await expect(uc.escribirAProductor(comprador, 'prod1', 'x'.repeat(1001), AHORA)).rejects.toThrow(/1000/);
  });
  test('si el plan del comprador vence, ya no puede seguir escribiendo pero el productor sí puede responder', async () => {
    const { uc } = armar();
    const { conversacionId } = await uc.escribirAProductor(comprador, 'prod1', 'Hola', AHORA);
    const detalle = await uc.obtener('comprador', conversacionId, new Date(AHORA.getTime() + 60 * DIA));
    expect(detalle.mensajes).toHaveLength(1);
  });
});

describe('Ronda 30 · alertas de disponibilidad y temporada (plan Negocio)', () => {
  function armar(conPlan = true, planVigenteHasta?: Date) {
    const memoria: PagoContacto[] = conPlan ? [confirmado({ usuarioId: 'u1', plan: 'Negocio' }, planVigenteHasta ? new Date(planVigenteHasta.getTime() - 30 * DIA) : undefined)] : [];
    const acceso = new AccesoContactoService(repoPagos(memoria));
    const alertas: any[] = [];
    const repo: any = {
      listarPorUsuario: async (u: string) => alertas.filter((a) => a.usuarioId === u), listarTodas: async () => alertas,
      buscar: async (u: string, p: string) => alertas.find((a) => a.usuarioId === u && a.plantaId === p) ?? null,
      guardar: async (a: any) => { const i = alertas.findIndex((x) => x.usuarioId === a.usuarioId && x.plantaId === a.plantaId); if (i >= 0) alertas[i] = a; else alertas.push(a); },
      eliminar: async (u: string, p: string) => { const i = alertas.findIndex((x) => x.usuarioId === u && x.plantaId === p); if (i >= 0) alertas.splice(i, 1); },
    };
    const productos: any[] = [];
    const plantas: any = { buscarPorId: async (id: string) => (id === 'pl1' ? { props: { id, nombreComun: 'Uña de gato' }, esVisiblePublicamente: () => true } : null) };
    const cultivos: any = { listarPorPlanta: async () => [{ props: { estadoValidacion: 'Validado', calendario: { mesesCosecha: [9, 10] } } }, { props: { estadoValidacion: 'Pendiente', calendario: { mesesCosecha: [1] } } }] };
    const prodRepo: any = { listar: async () => productos };
    const n = notificadorFake();
    const uc = new AlertasUseCase(repo, plantas, cultivos, prodRepo, n, acceso, usuariosFake([{ id: 'u1', rol: 'UsuarioRegistrado' }]));
    return { uc, n, productos };
  }
  const producto = (id: string, plantasIds: string[], estado = 'Validado') => ({ props: { id, plantasIds }, esVisiblePublicamente: () => estado === 'Validado' });
  test('sin plan Negocio no se puede seguir una planta', async () => {
    await expect(armar(false).uc.seguir('u1', 'pl1', {}, AHORA)).rejects.toThrow(/plan Negocio/);
  });
  test('avisa de la temporada (solo con fichas VALIDADAS) una vez por mes, y de cada producto nuevo una sola vez', async () => {
    const { uc, n, productos } = armar();
    await uc.seguir('u1', 'pl1', {}, AHORA); // septiembre: mes de cosecha; aún sin productos
    expect(n.enviados.map((e) => e.tipo)).toEqual(['alerta_temporada']);
    expect(n.enviados[0].mensaje).toMatch(/Uña de gato.*septiembre/);
    await uc.procesarUsuario('u1', AHORA); expect(n.enviados).toHaveLength(1); // idempotente
    productos.push(producto('a', ['pl1']), producto('b', ['pl1'], 'Pendiente'), producto('c', ['otra']));
    await uc.procesarUsuario('u1', AHORA);
    expect(n.enviados.map((e) => e.tipo)).toEqual(['alerta_temporada', 'alerta_disponibilidad']); // solo el aprobado y de esa planta
    await uc.procesarUsuario('u1', AHORA); expect(n.enviados).toHaveLength(2);
    productos.push(producto('d', ['pl1']));
    await uc.procesarTodas(AHORA); expect(n.enviados).toHaveLength(3);
    expect(n.enviados[2].mensaje).toMatch(/1 producto nuevo/);
    await uc.procesarTodas(new Date('2026-10-05T12:00:00Z')); expect(n.enviados).toHaveLength(4); // octubre también es cosecha: un aviso nuevo
    await uc.procesarTodas(new Date('2026-11-05T12:00:00Z')); expect(n.enviados).toHaveLength(4); // noviembre no
  });
  test('con el plan vencido las alertas no avisan; y se puede dejar de seguir', async () => {
    const { uc, n } = armar(true, new Date(AHORA.getTime() + 5 * DIA));
    await uc.seguir('u1', 'pl1', { temporada: false }, AHORA);
    const despues = new Date(AHORA.getTime() + 20 * DIA);
    await uc.procesarTodas(despues); expect(n.enviados).toHaveLength(0);
    expect((await uc.listar('u1', AHORA))).toHaveLength(1);
    await uc.dejarDeSeguir('u1', 'pl1'); expect((await uc.listar('u1', AHORA))).toHaveLength(0);
    await expect(uc.seguir('u1', 'pl1', { disponibilidad: false, temporada: false }, AHORA)).rejects.toThrow(/al menos un tipo/);
  });
});

describe('Ronda 30 · reportes agregados (plan Institucional)', () => {
  function armar(planes: PagoContacto[] = []) {
    const acceso = new AccesoContactoService(repoPagos(planes));
    const contactable = (id: string, zonas: string[]) => ({ id, nombre: `NOMBRE-${id}`, region: 'Tingo María', plantas: ['Uña de gato'], zonas, zonasProducto: [], certificado: false, tiposProductor: [] });
    const directorio: any = { todos: async () => [contactable('a', ['Leoncio Prado, Huánuco']), contactable('b', ['Leoncio Prado, Huánuco']), contactable('c', ['Leoncio Prado, Huánuco']), contactable('d', ['Tocache, San Martín'])] };
    const plantas: any = { listar: async () => [{ props: { id: 'pl1', nombreComun: 'Uña de gato' }, esVisiblePublicamente: () => true }] };
    const cultivos: any = { listarPorPlanta: async () => [{ props: { estadoValidacion: 'Validado' } }] };
    const productos: any = { listar: async () => [{ props: { plantasIds: ['pl1'], categoriasUso: ['Antiinflamatorio'], tipoProductor: 'Campesino' }, esVisiblePublicamente: () => true }] };
    const busquedas: any = { contarPorPlanta: async () => [{ plantaId: 'pl1', cantidad: 7 }] };
    return new ReporteBioeconomiaUseCase(usuariosFake([{ id: 'p1', rol: 'Productor' }, { id: 'inst', rol: 'UsuarioRegistrado' }]), plantas, cultivos, productos, directorio, busquedas, acceso);
  }
  test('solo el plan Institucional (o un administrador) puede ver el reporte', async () => {
    await expect(armar().ejecutar(undefined, AHORA)).rejects.toThrow(/sesión/);
    await expect(armar().ejecutar({ id: 'inst', rol: 'UsuarioRegistrado' }, AHORA)).rejects.toThrow(/Institucional/);
    await expect(armar([confirmado({ usuarioId: 'inst', plan: 'Empresarial', monto: 99 })]).ejecutar({ id: 'inst', rol: 'UsuarioRegistrado' }, AHORA)).rejects.toThrow(/Institucional/);
    const r = await armar([confirmado({ usuarioId: 'inst', plan: 'Institucional', monto: 120 })]).ejecutar({ id: 'inst', rol: 'UsuarioRegistrado' }, AHORA);
    expect(r.totales.productoresContactables).toBe(4);
    expect((await armar().ejecutar({ id: 'x', rol: 'Administrador' }, AHORA)).totales.plantasEnCatalogo).toBe(1);
  });
  test('es agregado: sin nombres ni datos personales, y las zonas con menos de 3 productores se ocultan', async () => {
    const r = await armar().ejecutar({ id: 'x', rol: 'Administrador' }, AHORA);
    expect(JSON.stringify(r)).not.toMatch(/NOMBRE-|telefono|correo|latitud|longitud/i);
    const leoncio = r.productoresPorZona.find((z) => z.etiqueta.startsWith('Leoncio'))!;
    const tocache = r.productoresPorZona.find((z) => z.etiqueta.startsWith('Tocache'))!;
    expect(UMBRAL_MINIMO).toBe(3);
    expect(leoncio).toMatchObject({ cantidad: 3, oculto: false });
    expect(tocache).toMatchObject({ cantidad: null, oculto: true }); // un solo productor: no se puede deducir quién es
    expect(r.plantasMasBuscadas[0]).toMatchObject({ etiqueta: 'Uña de gato', cantidad: 7 });
    expect(r.productosPorCategoria[0]).toMatchObject({ etiqueta: 'Antiinflamatorio', cantidad: 1 });
  });
});
