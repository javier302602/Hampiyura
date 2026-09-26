import { ListarPendientesUseCase } from '../../src/application/m09-validacion-moderacion/validacion.use-cases';
import { ListarPagosAdminUseCase } from '../../src/application/m15-planes/planes.use-cases';
import { ValidacionContenido } from '../../src/domain/entities/validacion-contenido.entity';
import { PagoContacto } from '../../src/domain/entities/pago-contacto.entity';

const nulo: any = { buscarPorId: async () => null };
const v = (id: string, tipoEntidad: string) => new ValidacionContenido({ id, tipoEntidad, entidadId: 'e' + id, estado: 'Pendiente', fecha: new Date(), autorId: 'u' });
const uc = () => new ListarPendientesUseCase({ listarPendientes: async () => [v('1', 'Cultivo'), v('2', 'ParteUso'), v('3', 'Preparacion'), v('4', 'EstadoConservacion'), v('5', 'Publicacion'), v('6', 'SolicitudCuenta')] } as any, nulo, nulo, nulo, nulo, nulo, nulo, nulo, nulo);
const tipos = async (rol?: string) => (await uc().ejecutar(rol)).map((x) => x.tipoEntidad);

describe('Ronda 23 · validaciones pendientes filtradas por el área del rol', () => {
  test('sin rol: todas (bandeja normal); Administrador: todas', async () => {
    expect((await tipos()).length).toBe(6);
    expect((await tipos('Administrador')).length).toBe(6);
  });
  test('un especialista en agronomía solo ve las de su área (fichas de cultivo)', async () => {
    expect(await tipos('EspecialistaAgronomo')).toEqual(['Cultivo']);
  });
  test('un especialista en salud solo ve las suyas (partes+uso y preparaciones), nunca las de agronomía', async () => {
    expect(await tipos('EspecialistaSalud')).toEqual(['ParteUso', 'Preparacion']);
  });
  test('un especialista en conservación solo ve las de conservación', async () => {
    expect(await tipos('EspecialistaConservacion')).toEqual(['EstadoConservacion']);
  });
  test('el criterio coincide con el conteo del panel (mismo rolPuedeValidarTipo)', async () => {
    const { rolPuedeValidarTipo } = require('../../src/domain/entities/validacion-contenido.entity');
    for (const rol of ['EspecialistaSalud', 'EspecialistaAgronomo', 'EspecialistaConservacion']) {
      expect((await tipos(rol)).length).toBe(['Cultivo', 'ParteUso', 'Preparacion', 'EstadoConservacion', 'Publicacion', 'SolicitudCuenta'].filter((t) => rolPuedeValidarTipo(rol, t)).length);
    }
  });
});

describe('Ronda 23 · pagos: planes vigentes y desbloqueos vigentes por separado', () => {
  const DIA = 86400000;
  const pago = (id: string, concepto: 'Plan' | 'Desbloqueo', hace: number | null, estado: 'Confirmado' | 'Pendiente' = 'Confirmado') => {
    const p = new PagoContacto({ id, usuarioId: 'u', concepto, plan: concepto === 'Plan' ? 'Negocio' : undefined, productorId: concepto === 'Desbloqueo' ? 'p' : undefined, monto: 1, metodo: 'Yape', comprobanteUrl: '/uploads/a.png', estado: 'Pendiente', creadoEn: new Date() });
    if (estado === 'Confirmado' && hace !== null) p.confirmar('adm', new Date(Date.now() - hace * DIA));
    return p;
  };
  const todos = [pago('planVigente', 'Plan', 5), pago('planVencido', 'Plan', 40), pago('desbVigente', 'Desbloqueo', 3), pago('desbVencido', 'Desbloqueo', 45), pago('planPendiente', 'Plan', null, 'Pendiente')];
  const repo: any = { listar: async (e?: string) => todos.filter((p) => !e || p.props.estado === e) };
  const usuarios: any = { buscarPorId: async () => ({ props: { nombre: 'X' } }) };
  const ids = async (f?: any) => (await new ListarPagosAdminUseCase(repo, usuarios).ejecutar(f)).map((p) => p.id);
  test('PlanesVigentes: solo planes confirmados y no vencidos (sin desbloqueos, sin vencidos, sin pendientes)', async () => {
    expect(await ids('PlanesVigentes')).toEqual(['planVigente']);
  });
  test('DesbloqueosVigentes: solo desbloqueos puntuales no vencidos, separados de los planes', async () => {
    expect(await ids('DesbloqueosVigentes')).toEqual(['desbVigente']);
  });
  test('los estados de siempre siguen igual', async () => {
    expect((await ids('Confirmado')).length).toBe(4);
    expect(await ids('Pendiente')).toEqual(['planPendiente']);
    expect((await ids()).length).toBe(5);
  });
});
