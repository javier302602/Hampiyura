import { PagoContacto } from '../../src/domain/entities/pago-contacto.entity';
import { AccesoContactoService, DirectorioProductoresUseCase, SolicitarPagoUseCase, ProtegerContactoProductosUseCase, ListarPlanesUseCase, MiPlanUseCase } from '../../src/application/m15-planes/planes.use-cases';
import { ActualizarPerfilUseCase } from '../../src/application/m01-cuentas/cuentas.use-cases';
import { CrearConsultaUseCase } from '../../src/application/m08-consultas/consultas.use-cases';
import { DIAS_VIGENCIA, precioDe } from '../../src/domain/value-objects/plan.vo';

const DIA = 24 * 60 * 60 * 1000;
function pago(over: Partial<PagoContacto['props']> = {}) {
  return new PagoContacto({ id: 'p1', usuarioId: 'u1', concepto: 'Plan', plan: 'Negocio', monto: 29, metodo: 'Yape', comprobanteUrl: '/uploads/a.png', estado: 'Pendiente', creadoEn: new Date(), ...over });
}
function repoEn(memoria: PagoContacto[]): any {
  return {
    guardar: jest.fn(async (p: PagoContacto) => { memoria.push(p); }),
    actualizar: jest.fn(),
    buscarPorId: jest.fn(async (id: string) => memoria.find((p) => p.props.id === id) ?? null),
    listarPorUsuario: jest.fn(async (u: string) => memoria.filter((p) => p.props.usuarioId === u)),
    listar: jest.fn(async (e?: string) => memoria.filter((p) => !e || p.props.estado === e)),
  };
}

describe('M-15 · PagoContacto', () => {
  test('confirmar abre una vigencia de 30 días; antes de confirmar no da acceso', () => {
    const p = pago();
    expect(p.estaVigente()).toBe(false);
    const t0 = new Date('2026-09-26T10:00:00Z');
    p.confirmar('admin', t0);
    expect(p.props.estado).toBe('Confirmado');
    expect(p.props.vigenteHasta!.getTime() - t0.getTime()).toBe(DIAS_VIGENCIA * DIA);
    expect(p.estaVigente(new Date(t0.getTime() + 29 * DIA))).toBe(true);
  });
  test('pasado el vencimiento el estado efectivo es Vencido (sin cron)', () => {
    const p = pago(); const t0 = new Date('2026-09-26T10:00:00Z'); p.confirmar('admin', t0);
    expect(p.estadoEfectivo(new Date(t0.getTime() + 31 * DIA))).toBe('Vencido');
    expect(p.estaVigente(new Date(t0.getTime() + 31 * DIA))).toBe(false);
  });
  test('rechazar exige motivo y un pago resuelto no se puede resolver otra vez', () => {
    const p = pago();
    expect(() => p.rechazar('admin', '  ')).toThrow(/motivo/i);
    p.rechazar('admin', 'La captura no muestra el monto');
    expect(p.props.estado).toBe('Rechazado');
    expect(() => p.confirmar('admin')).toThrow(/ya fue resuelto/i);
  });
});

describe('M-15 · acceso al contacto (regla de negocio)', () => {
  test('sin plan ni desbloqueo: no ve el contacto; con Negocio vigente sí; vencido no', async () => {
    const memoria: PagoContacto[] = []; const acceso = new AccesoContactoService(repoEn(memoria));
    const solicitante = { id: 'comprador', rol: 'UsuarioRegistrado' };
    expect(await acceso.puedeVerContacto(solicitante, 'prod1')).toBe(false);
    expect(await acceso.puedeVerContacto(undefined, 'prod1')).toBe(false);
    const p = pago({ usuarioId: 'comprador' }); p.confirmar('admin', new Date(Date.now() - 2 * DIA)); memoria.push(p);
    expect(await acceso.puedeVerContacto(solicitante, 'prod1')).toBe(true);
    expect(await acceso.puedeVerContacto(solicitante, 'prod1', new Date(Date.now() + 40 * DIA))).toBe(false);
  });
  test('un pago Pendiente o Rechazado NO da acceso', async () => {
    const memoria = [pago({ usuarioId: 'c' }), pago({ id: 'p2', usuarioId: 'c', estado: 'Rechazado' })];
    expect(await new AccesoContactoService(repoEn(memoria)).puedeVerContacto({ id: 'c', rol: 'UsuarioRegistrado' }, 'prod1')).toBe(false);
  });
  test('el desbloqueo puntual vale SOLO para ese productor', async () => {
    const d = pago({ concepto: 'Desbloqueo', plan: undefined, productorId: 'prodA', usuarioId: 'c', monto: 4 }); d.confirmar('admin');
    const acceso = new AccesoContactoService(repoEn([d]));
    expect(await acceso.puedeVerContacto({ id: 'c', rol: 'UsuarioRegistrado' }, 'prodA')).toBe(true);
    expect(await acceso.puedeVerContacto({ id: 'c', rol: 'UsuarioRegistrado' }, 'prodB')).toBe(false);
  });
  test('el propio productor y el administrador ven siempre; el plan Destacado NO da acceso a contactos ajenos', async () => {
    const dest = pago({ plan: 'Destacado', usuarioId: 'prod9', monto: 15 }); dest.confirmar('admin');
    const acceso = new AccesoContactoService(repoEn([dest]));
    expect(await acceso.puedeVerContacto({ id: 'prodA', rol: 'Productor' }, 'prodA')).toBe(true);
    expect(await acceso.puedeVerContacto({ id: 'x', rol: 'Administrador' }, 'prodA')).toBe(true);
    expect(await acceso.puedeVerContacto({ id: 'prod9', rol: 'Productor' }, 'prodA')).toBe(false);
  });
  test('en las fichas de producto el contacto se oculta si no hay acceso', async () => {
    const acceso = new AccesoContactoService(repoEn([]));
    const [p] = await new ProtegerContactoProductosUseCase(acceso).aplicar([{ productorId: 'prodA', contactoVendedor: 'WhatsApp 999' }], { id: 'c', rol: 'UsuarioRegistrado' });
    expect(p.contactoVendedor).toBeNull(); expect(p.contactoBloqueado).toBe(true);
  });
});

describe('M-15 · directorio: solo productores con ficha de cultivo validada', () => {
  function armar(estadoCultivo: string, rol = 'Productor') {
    const usuarios: any = { listar: jest.fn().mockResolvedValue([{ props: { id: 'prodA', nombre: 'Ana', rol, estado: 'Activo', region: 'Tingo María', nombreNegocio: 'Huerta Ana', telefono: '999111222' } }]), buscarPorId: jest.fn().mockResolvedValue({ props: { id: 'prodA', telefono: '999111222' } }) };
    const mapa: any = { listarTodas: jest.fn().mockResolvedValue([{ props: { autorId: 'prodA', cultivoId: 'c1', plantaId: 'pl1', zona: 'Tingo María' } }]) };
    const cultivos: any = { buscarPorId: jest.fn().mockResolvedValue({ props: { estadoValidacion: estadoCultivo } }) };
    const plantas: any = { buscarPorId: jest.fn().mockResolvedValue({ props: { nombreComun: 'Uña de gato' } }) };
    const productos: any = { listar: jest.fn().mockResolvedValue([{ props: { productorId: 'prodA', contactoVendedor: 'WhatsApp 999111222' }, esVisiblePublicamente: () => true }]) };
    const memoria: PagoContacto[] = [];
    const acceso = new AccesoContactoService(repoEn(memoria));
    return { dir: new DirectorioProductoresUseCase(usuarios, mapa, cultivos, plantas, productos, acceso), memoria };
  }
  test('con ficha validada aparece; con ficha Pendiente NO', async () => {
    expect((await armar('Validado').dir.listar()).map((p) => p.id)).toEqual(['prodA']);
    expect(await armar('Pendiente').dir.listar()).toEqual([]);
  });
  test('un usuario que no es Productor no aparece aunque tenga ubicación validada', async () => {
    expect(await armar('Validado', 'UsuarioRegistrado').dir.listar()).toEqual([]);
  });
  test('sin plan la ficha llega con contacto=null; con desbloqueo vigente trae teléfono y contactos de productos', async () => {
    const { dir, memoria } = armar('Validado');
    const bloqueada = await dir.obtener('prodA', { id: 'c', rol: 'UsuarioRegistrado' });
    expect(bloqueada.contactoDisponible).toBe(false); expect(bloqueada.contacto).toBeNull();
    const d = pago({ concepto: 'Desbloqueo', plan: undefined, productorId: 'prodA', usuarioId: 'c', monto: 4 }); d.confirmar('admin'); memoria.push(d);
    const abierta = await dir.obtener('prodA', { id: 'c', rol: 'UsuarioRegistrado' });
    expect(abierta.contacto).toEqual({ telefono: '999111222', contactosDeProductos: ['WhatsApp 999111222'] });
  });
  test('un productor sin ficha validada no se puede consultar por id', async () => {
    await expect(armar('Pendiente').dir.obtener('prodA', { id: 'c', rol: 'UsuarioRegistrado' })).rejects.toThrow(/no está disponible/);
  });
});

describe('M-15 · solicitud de pago', () => {
  function uc(contactable = true) {
    const memoria: PagoContacto[] = []; const repo = repoEn(memoria);
    const directorio: any = { esContactable: jest.fn().mockResolvedValue(contactable) };
    return { uc: new SolicitarPagoUseCase(repo, directorio, new AccesoContactoService(repo)), memoria };
  }
  const base = { usuarioId: 'u1', rol: 'UsuarioRegistrado', metodo: 'Yape', comprobanteUrl: '/uploads/x.png' };
  test('el monto lo fija el servidor según el plan', async () => {
    const { uc: u } = uc();
    expect((await u.ejecutar({ ...base, concepto: 'Plan', plan: 'Negocio' })).props.monto).toBe(precioDe('Negocio'));
    expect((await u.ejecutar({ ...base, concepto: 'Desbloqueo', productorId: 'prodA' })).props.monto).toBe(precioDe('DesbloqueoPuntual'));
  });
  test('rechaza método inválido, comprobante ajeno a la plataforma y Destacado para no productores', async () => {
    const { uc: u } = uc();
    await expect(u.ejecutar({ ...base, metodo: 'Paypal', concepto: 'Plan', plan: 'Negocio' })).rejects.toThrow(/Yape o Plin/);
    await expect(u.ejecutar({ ...base, comprobanteUrl: 'https://evil.example/x.png', concepto: 'Plan', plan: 'Negocio' })).rejects.toThrow(/comprobante/i);
    await expect(u.ejecutar({ ...base, concepto: 'Plan', plan: 'Destacado' })).rejects.toThrow(/Productor/);
  });
  test('no se puede desbloquear a un productor no contactable ni pagar dos veces lo mismo pendiente', async () => {
    await expect(uc(false).uc.ejecutar({ ...base, concepto: 'Desbloqueo', productorId: 'x' })).rejects.toThrow(/no está disponible/);
    const { uc: u } = uc();
    await u.ejecutar({ ...base, concepto: 'Plan', plan: 'Negocio' });
    await expect(u.ejecutar({ ...base, concepto: 'Plan', plan: 'Negocio' })).rejects.toThrow(/esperando confirmación/);
  });
});

describe('M-15 · catálogo y Mi plan', () => {
  test('los planes son precios de referencia y el fondo es solo un contador (10 % de lo confirmado en planes)', async () => {
    const c = pago({ monto: 100 }); c.confirmar('admin');
    const d = pago({ id: 'p2', concepto: 'Desbloqueo', plan: undefined, productorId: 'x', monto: 4 }); d.confirmar('admin');
    const cat = await new ListarPlanesUseCase(repoEn([c, d]), { yape: null, plin: null }).ejecutar();
    expect(cat.planes.every((p) => p.referencial)).toBe(true);
    expect(cat.fondoConservacion).toMatchObject({ porcentaje: 10, acumuladoSoles: 10, esContador: true });
  });
  test('Mi plan: Explorador con pago Pendiente; Negocio vigente tras confirmar; Vencido después', async () => {
    const memoria = [pago({ usuarioId: 'u9' })]; const repo = repoEn(memoria);
    const usuarios: any = { buscarPorId: jest.fn().mockResolvedValue({ props: { nombre: 'X', correo: 'x@x' } }) };
    const uc = new MiPlanUseCase(repo, usuarios, new AccesoContactoService(repo));
    expect(await uc.ejecutar('u9')).toMatchObject({ plan: 'Explorador', estadoPago: 'Pendiente' });
    memoria[0].confirmar('admin', new Date());
    expect(await uc.ejecutar('u9')).toMatchObject({ plan: 'Negocio', estadoPago: 'Confirmado' });
    memoria[0].props.vigenteHasta = new Date(Date.now() - DIA);
    expect(await uc.ejecutar('u9')).toMatchObject({ plan: 'Explorador', estadoPago: 'Vencido' });
  });
});

describe('Perfil (campos básicos)', () => {
  function uc(rol = 'UsuarioRegistrado') {
    const usuario: any = { props: { id: 'u1', rol, region: 'Pendiente', contraseñaHash: 'h' } };
    const repo: any = { buscarPorId: jest.fn().mockResolvedValue(usuario), actualizar: jest.fn() };
    return { uc: new ActualizarPerfilUseCase(repo), usuario, repo };
  }
  test('guarda teléfono, región y biografía; vacío borra el campo', async () => {
    const { uc: u, usuario } = uc();
    await u.ejecutar('u1', { telefono: ' +51 999 111 222 ', region: 'Tingo María', biografia: 'Cultivo uña de gato' });
    expect(usuario.props).toMatchObject({ telefono: '+51 999 111 222', region: 'Tingo María', biografia: 'Cultivo uña de gato' });
    await u.ejecutar('u1', { telefono: '' });
    expect(usuario.props.telefono).toBeNull();
  });
  test('valida teléfono, biografía y que el nombre de negocio sea solo de Productor', async () => {
    const { uc: u } = uc();
    await expect(u.ejecutar('u1', { telefono: 'abc' })).rejects.toThrow(/teléfono/i);
    await expect(u.ejecutar('u1', { biografia: 'x'.repeat(301) })).rejects.toThrow(/300/);
    await expect(u.ejecutar('u1', { nombreNegocio: 'Mi negocio' })).rejects.toThrow(/Productor/);
    const p = uc('Productor');
    await p.uc.ejecutar('u1', { nombreNegocio: 'Huerta Ana' });
    expect(p.usuario.props.nombreNegocio).toBe('Huerta Ana');
  });
});

describe('M-08 · consulta con fotos y ubicación (gratis)', () => {
  test('acepta fotos de /uploads y ubicación válida, sin ningún plan', async () => {
    const repo: any = { guardar: jest.fn() };
    const c = await new CrearConsultaUseCase(repo).ejecutar({ tipo: 'PreguntaGeneral', descripcion: 'Hola', imagenes: ['/uploads/a.png'], latitud: -9.29, longitud: -75.99 });
    expect(c.props).toMatchObject({ imagenes: ['/uploads/a.png'], latitud: -9.29, longitud: -75.99 });
  });
  test('rechaza más de 5 fotos, URLs ajenas y latitud sin longitud', async () => {
    const uc = new CrearConsultaUseCase({ guardar: jest.fn() } as any);
    const b = { tipo: 'PreguntaGeneral', descripcion: 'Hola' };
    await expect(uc.ejecutar({ ...b, imagenes: Array(6).fill('/uploads/a.png') })).rejects.toThrow(/5 fotos/);
    await expect(uc.ejecutar({ ...b, imagenes: ['http://x/y.png'] })).rejects.toThrow(/plataforma/);
    await expect(uc.ejecutar({ ...b, latitud: -9 })).rejects.toThrow(/juntas/);
  });
});
