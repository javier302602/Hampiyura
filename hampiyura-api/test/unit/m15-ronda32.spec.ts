import { PagoContacto } from '../../src/domain/entities/pago-contacto.entity';
import { AccesoContactoService, SolicitarPagoUseCase, MiPlanUseCase, ResolverPagoUseCase } from '../../src/application/m15-planes/planes.use-cases';
import { CATALOGO_PLANES, incluyeProductoresDisponibles } from '../../src/domain/value-objects/plan.vo';

// Ronda 32: "Productores disponibles" queda INCLUIDO en Empresarial e Institucional; con Negocio sigue necesitando el complemento Premium (S/ 19).
const DIA = 24 * 3600_000;
const AHORA = new Date('2026-09-26T12:00:00Z');
const pago = (over: Partial<PagoContacto['props']> = {}, confirmar = true, cuando = new Date(AHORA.getTime() - 2 * DIA)) => {
  const p = new PagoContacto({ id: Math.random().toString(36).slice(2), usuarioId: 'c', concepto: 'Plan', plan: 'Negocio', monto: 29, metodo: 'Yape', comprobanteUrl: '/uploads/a.png', estado: 'Pendiente', creadoEn: AHORA, ...over });
  if (confirmar) p.confirmar('admin', cuando);
  return p;
};
const repo = (m: PagoContacto[]): any => ({ guardar: async (p: PagoContacto) => { m.push(p); }, actualizar: async () => {}, buscarPorId: async (id: string) => m.find((p) => p.props.id === id) ?? null,
  listarPorUsuario: async (u: string) => m.filter((p) => p.props.usuarioId === u), listar: async () => m });
const comprador = { id: 'c', rol: 'UsuarioRegistrado' };

describe('Ronda 32 · acceso a "Productores disponibles" según el plan', () => {
  const acceso = (m: PagoContacto[]) => new AccesoContactoService(repo(m));
  test('Negocio SIN Premium: bloqueado; con Premium vigente: permitido; con Premium vencido: bloqueado otra vez', async () => {
    const m = [pago({ plan: 'Negocio' })]; const a = acceso(m);
    const sin = await a.puedeVerProductoresDisponibles(comprador, AHORA);
    expect(sin.permitido).toBe(false); expect(sin.motivo).toMatch(/complemento Premium.*Empresarial e Institucional ya la incluyen/);
    m.push(pago({ plan: 'Premium', monto: 19 }));
    expect((await a.puedeVerProductoresDisponibles(comprador, AHORA)).permitido).toBe(true);
    const mas = new Date(AHORA.getTime() + 20 * DIA); // Premium (30 días desde hace 2) sigue; a los 29 días ya no
    expect((await a.puedeVerProductoresDisponibles(comprador, new Date(AHORA.getTime() + 29 * DIA))).permitido).toBe(false);
    expect(mas).toBeInstanceOf(Date);
  });
  test('Empresarial e Institucional vigentes: acceso automático, SIN necesitar Premium', async () => {
    for (const plan of ['Empresarial', 'Institucional'] as const) {
      const a = acceso([pago({ plan, monto: 99 })]);
      expect({ plan, ok: (await a.puedeVerProductoresDisponibles(comprador, AHORA)).permitido }).toEqual({ plan, ok: true });
    }
  });
  test('sin plan vigente no hay acceso (ni con Premium suelto, ni con Empresarial vencido); el administrador siempre entra', async () => {
    expect((await acceso([]).puedeVerProductoresDisponibles(comprador, AHORA)).permitido).toBe(false);
    expect((await acceso([]).puedeVerProductoresDisponibles(undefined, AHORA)).permitido).toBe(false);
    expect((await acceso([pago({ plan: 'Premium', monto: 19 })]).puedeVerProductoresDisponibles(comprador, AHORA)).permitido).toBe(false);
    expect((await acceso([pago({ plan: 'Empresarial', monto: 99 })]).puedeVerProductoresDisponibles(comprador, new Date(AHORA.getTime() + 40 * DIA))).permitido).toBe(false);
    expect((await acceso([]).puedeVerProductoresDisponibles({ id: 'a', rol: 'Administrador' }, AHORA)).permitido).toBe(true);
  });
  test('quien pasa de Negocio+Premium a Empresarial e Institucional mantiene el acceso (lo da el plan)', async () => {
    const m = [pago({ plan: 'Negocio' }), pago({ plan: 'Premium', monto: 19 })]; const a = acceso(m);
    m.push(pago({ plan: 'Institucional', monto: 120 }));
    expect((await a.puedeVerProductoresDisponibles(comprador, AHORA)).permitido).toBe(true);
    expect(incluyeProductoresDisponibles((await a.planActivo('c', AHORA)).plan)).toBe(true);
  });
});

describe('Ronda 32 · compra del complemento Premium', () => {
  const pedir = (m: PagoContacto[]) => new SolicitarPagoUseCase(repo(m), {} as any, new AccesoContactoService(repo(m))).ejecutar({ usuarioId: 'c', rol: 'UsuarioRegistrado', concepto: 'Plan', plan: 'Premium', metodo: 'Yape', comprobanteUrl: '/uploads/x.png' });
  test('con Negocio se puede comprar (S/ 19); con Empresarial o Institucional, "Ya incluido en tu plan"; sin plan, no', async () => {
    const p = await pedir([pago({ plan: 'Negocio' })]); expect(p.props.monto).toBe(19);
    for (const plan of ['Empresarial', 'Institucional'] as const) await expect(pedir([pago({ plan, monto: 99 })])).rejects.toThrow(/Ya incluido en tu plan/);
    await expect(pedir([])).rejects.toThrow(/complemento del plan Negocio/);
  });
  test('quien tenía Premium con Negocio y sube a Empresarial: no puede volver a comprarlo (no se cobra de más) y Mi plan lo muestra "incluido"', async () => {
    const m = [pago({ plan: 'Negocio' }), pago({ plan: 'Premium', monto: 19 })];
    const usuarios: any = { buscarPorId: async () => ({ props: { nombre: 'X' } }) };
    const mi = new MiPlanUseCase(repo(m), usuarios, new AccesoContactoService(repo(m)));
    expect((await mi.ejecutar('c')).premium).toMatchObject({ activo: true, incluidoEnPlan: false }); // Negocio + Premium pagado
    m.push(pago({ plan: 'Empresarial', monto: 99 }));
    const despues = (await mi.ejecutar('c')).premium;
    expect(despues).toMatchObject({ activo: true, incluidoEnPlan: true }); expect(despues.vigenteHasta).toBeUndefined();
    await expect(pedir(m)).rejects.toThrow(/Ya incluido/);
  });
  test('un pago de Premium PENDIENTE de alguien que ya tiene Empresarial/Institucional no se puede confirmar (se cobraría de más)', async () => {
    const m = [pago({ plan: 'Empresarial', monto: 99 })]; const pendiente = pago({ plan: 'Premium', monto: 19 }, false); m.push(pendiente);
    const uc = new ResolverPagoUseCase(repo(m), { notificar: async () => {} } as any, new AccesoContactoService(repo(m)));
    await expect(uc.confirmar(pendiente.props.id, 'admin')).rejects.toThrow(/se cobraría de más/);
    expect(pendiente.props.estado).toBe('Pendiente');
    // con solo Negocio sí se confirma
    const m2 = [pago({ plan: 'Negocio' })]; const p2 = pago({ plan: 'Premium', monto: 19 }, false); m2.push(p2);
    await new ResolverPagoUseCase(repo(m2), { notificar: async () => {} } as any, new AccesoContactoService(repo(m2))).confirmar(p2.props.id, 'admin');
    expect(p2.props.estado).toBe('Confirmado');
  });
});

describe('Ronda 32 · catálogo', () => {
  test('Empresarial e Institucional listan "Productores disponibles" incluido; Premium es exclusivo del plan Negocio', () => {
    for (const id of ['Empresarial', 'Institucional']) expect(CATALOGO_PLANES.find((p) => p.id === id)!.incluye.join(' | ')).toMatch(/Productores disponibles.*incluida, sin costo extra/);
    const premium = CATALOGO_PLANES.find((p) => p.id === 'Premium')!;
    expect(premium.paraQuien).toMatch(/Exclusivo para quien tiene el plan Negocio/);
    expect(premium.incluye.join(' | ')).toMatch(/Empresarial e Institucional ya la incluyen sin costo extra/);
    expect(premium.precio).toBe(19);
    expect(CATALOGO_PLANES.find((p) => p.id === 'Negocio')!.incluye.join(' | ')).not.toMatch(/Productores disponibles/);
  });
});
