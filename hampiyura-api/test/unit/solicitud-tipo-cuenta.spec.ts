import { SolicitarTipoCuentaUseCase, ObtenerMiTipoCuentaUseCase, SolicitudCuentaValidable } from '../../src/application/m01-cuentas/solicitud-tipo-cuenta.use-cases';
import { SolicitudCuenta } from '../../src/domain/entities/solicitud-cuenta.entity';
import { ValidacionContenido } from '../../src/domain/entities/validacion-contenido.entity';
import { AprobarContenidoUseCase } from '../../src/application/m09-validacion-moderacion/validacion.use-cases';

const usuario = (props: any = {}) => ({ props: { id: 'u1', nombre: 'Ana', rol: 'UsuarioRegistrado', estado: 'Activo', ...props } });
const descripcion = 'Cultivo plantas medicinales en Tingo María desde hace diez años.';

function armar(u: any = usuario(), existentes: SolicitudCuenta[] = []) {
  const guardadas: SolicitudCuenta[] = [...existentes];
  const solicitudes: any = {
    guardar: jest.fn(async (s: SolicitudCuenta) => { guardadas.push(s); }),
    buscarPorId: jest.fn(async (id: string) => guardadas.find((s) => s.props.id === id) ?? null),
    listarPorUsuario: jest.fn(async () => guardadas),
    actualizarEstadoValidacion: jest.fn(async (id: string, estado: any) => { const s = guardadas.find((x) => x.props.id === id); if (s) s.props.estadoValidacion = estado; }),
  };
  const validaciones: any = { guardar: jest.fn(), listar: jest.fn().mockResolvedValue([]) };
  const usuarios: any = { buscarPorId: jest.fn().mockResolvedValue(u), actualizar: jest.fn() };
  return { solicitudes, validaciones, usuarios, guardadas, uc: new SolicitarTipoCuentaUseCase(solicitudes, validaciones, usuarios) };
}

describe('Solicitud de cambio de tipo de cuenta (Ronda 18)', () => {
  test('queda PENDIENTE y entra a la bandeja de validación; no cambia nada en la cuenta', async () => {
    const { uc, validaciones, usuarios } = armar();
    const s = await uc.ejecutar({ usuarioId: 'u1', tipo: 'Productor', nombreOrganizacion: 'Huerta Ana', descripcion });
    expect(s.props.estadoValidacion).toBe('Pendiente');
    expect(validaciones.guardar.mock.calls[0][0].props).toMatchObject({ tipoEntidad: 'SolicitudCuenta', entidadId: s.props.id, estado: 'Pendiente' });
    expect(usuarios.actualizar).not.toHaveBeenCalled();
  });
  test('cada tipo pide sus campos: Empresario e Institución exigen el nombre; Productor no', async () => {
    await expect(armar().uc.ejecutar({ usuarioId: 'u1', tipo: 'Empresario', descripcion })).rejects.toThrow(/nombre de tu empresa/);
    await expect(armar().uc.ejecutar({ usuarioId: 'u1', tipo: 'Institucion', descripcion })).rejects.toThrow(/nombre de la institución/);
    await expect(armar().uc.ejecutar({ usuarioId: 'u1', tipo: 'Productor', descripcion })).resolves.toBeDefined();
    await expect(armar().uc.ejecutar({ usuarioId: 'u1', tipo: 'Productor', descripcion: 'corto' })).rejects.toThrow(/20 caracteres/);
    await expect(armar().uc.ejecutar({ usuarioId: 'u1', tipo: 'Institucion', nombreOrganizacion: 'UNAS', descripcion, sitioWeb: 'javascript:alert(1)' })).rejects.toThrow(/http/);
  });
  test('un tipo inventado, un rol de equipo, quien ya tiene tipo o una cuenta inactiva no pueden solicitar', async () => {
    await expect(armar().uc.ejecutar({ usuarioId: 'u1', tipo: 'Administrador', descripcion })).rejects.toThrow(/Elige Productor/);
    await expect(armar(usuario({ rol: 'Administrador' })).uc.ejecutar({ usuarioId: 'u1', tipo: 'Productor', descripcion })).rejects.toThrow(/cuentas normales/);
    await expect(armar(usuario({ tipoCuenta: 'Empresario' })).uc.ejecutar({ usuarioId: 'u1', tipo: 'Productor', descripcion })).rejects.toThrow(/ya tiene un tipo/);
    await expect(armar(usuario({ estado: 'PendienteActivacion' })).uc.ejecutar({ usuarioId: 'u1', tipo: 'Productor', descripcion })).rejects.toThrow(/activa/);
  });
  test('no se acumulan solicitudes: con una en curso no se puede mandar otra', async () => {
    const { uc } = armar();
    await uc.ejecutar({ usuarioId: 'u1', tipo: 'Productor', descripcion });
    await expect(uc.ejecutar({ usuarioId: 'u1', tipo: 'Empresario', nombreOrganizacion: 'X', descripcion })).rejects.toThrow(/pendiente/);
  });
  test('al APROBARLA (flujo real de M-09) se aplica el tipo; Productor además recibe el rol; Empresario no cambia de rol', async () => {
    for (const [tipo, rolEsperado] of [['Productor', 'Productor'], ['Empresario', 'UsuarioRegistrado'], ['Institucion', 'UsuarioRegistrado']] as const) {
      const u = usuario();
      const ctx = armar(u);
      const s = await ctx.uc.ejecutar({ usuarioId: 'u1', tipo, nombreOrganizacion: 'Mi Organización', descripcion });
      const v = new ValidacionContenido({ id: 'v1', tipoEntidad: 'SolicitudCuenta', entidadId: s.props.id, estado: 'Pendiente', fecha: new Date(), autorId: 'u1' });
      const repoV: any = { buscarPorId: jest.fn().mockResolvedValue(v), guardar: jest.fn() };
      const notificador: any = { notificar: jest.fn() };
      const registro = { SolicitudCuenta: new SolicitudCuentaValidable(ctx.solicitudes, ctx.usuarios) };
      await new AprobarContenidoUseCase(repoV, notificador, registro).ejecutar({ validacionId: 'v1', validadorId: 'adm', rol: 'Administrador' });
      expect(u.props).toMatchObject({ tipoCuenta: tipo, rol: rolEsperado, nombreNegocio: 'Mi Organización' });
    }
  });
  test('un especialista NO puede decidir esta solicitud (no tiene área asignada: solo Administrador)', async () => {
    const ctx = armar();
    const s = await ctx.uc.ejecutar({ usuarioId: 'u1', tipo: 'Productor', descripcion });
    const v = new ValidacionContenido({ id: 'v1', tipoEntidad: 'SolicitudCuenta', entidadId: s.props.id, estado: 'Pendiente', fecha: new Date(), autorId: 'u1' });
    const repoV: any = { buscarPorId: jest.fn().mockResolvedValue(v), guardar: jest.fn() };
    const registro = { SolicitudCuenta: new SolicitudCuentaValidable(ctx.solicitudes, ctx.usuarios) };
    await expect(new AprobarContenidoUseCase(repoV, { notificar: jest.fn() } as any, registro).ejecutar({ validacionId: 'v1', validadorId: 'esp', rol: 'EspecialistaSalud' })).rejects.toThrow(/administrador/i);
    expect(ctx.usuarios.actualizar).not.toHaveBeenCalled();
  });
  test('rechazarla no cambia la cuenta', async () => {
    const ctx = armar();
    const s = await ctx.uc.ejecutar({ usuarioId: 'u1', tipo: 'Productor', descripcion });
    await new SolicitudCuentaValidable(ctx.solicitudes, ctx.usuarios).actualizarEstadoValidacion(s.props.id, 'Rechazado');
    expect(ctx.usuarios.actualizar).not.toHaveBeenCalled();
    expect(s.props.estadoValidacion).toBe('Rechazado');
  });
  test('mi tipo de cuenta no menciona ningún plan: aprobar el tipo es gratis y no activa nada de M-15', async () => {
    for (const tipo of ['Productor', 'Empresario', 'Institucion'] as const) {
      const ctx = armar();
      await ctx.uc.ejecutar({ usuarioId: 'u1', tipo, nombreOrganizacion: 'X', descripcion });
      const mi = await new ObtenerMiTipoCuentaUseCase(ctx.solicitudes, ctx.validaciones, ctx.usuarios).ejecutar('u1');
      expect(mi.solicitud).not.toBeNull();
      expect(JSON.stringify(mi)).not.toMatch(/plan/i);
      expect(mi.puedeSolicitar).toBe(false); // ya tiene una en curso
    }
  });
});
