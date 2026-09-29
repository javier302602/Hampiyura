import { ContratoCultivo, ContratoCultivoProps } from '../../src/domain/entities/contrato-cultivo.entity';
import { ContratosCultivoUseCase, Solicitante } from '../../src/application/m17-compra-cultivo/contratos-cultivo.use-cases';

// M-17 · Compra directa de cosecha: el comprador propone cantidad+monto sobre una ficha de cultivo ya validada,
// el agricultor acepta (dando su medio de cobro) o rechaza, el comprador paga el 50% de adelanto y sube el
// comprobante, el agricultor lo confirma (o lo rechaza) y, al completar, se muestra el desglose con la comisión
// del 3% -- sin custodiar dinero en ningún momento, igual que M-16.
const AHORA = new Date('2026-09-29T12:00:00Z');
const base = (over: Partial<ContratoCultivoProps> = {}): ContratoCultivoProps => ({
  id: 'c1', cultivoId: 'cultivo1', plantaId: 'planta1', plantaNombre: 'Plátano', agricultorId: 'agricultor', compradorId: 'comprador',
  cantidad: '50 kg', montoAcordado: 200, montoAdelanto: 100, montoSaldo: 100, comisionReferencial: 6, netoAgricultor: 194,
  estado: 'Propuesto', eventos: [{ estado: 'Propuesto', fecha: AHORA, actorId: 'comprador' }], creadoEn: AHORA, actualizadoEn: AHORA, ...over,
});

describe('ContratoCultivo · máquina de estados', () => {
  test('flujo feliz completo: aceptar -> informar adelanto -> confirmar -> completado', () => {
    const c = new ContratoCultivo(base());
    c.aceptar('agricultor', 'Yape', '999888777', AHORA);
    expect(c.props.estado).toBe('AdelantoPendiente'); expect(c.props.cobroMedio).toBe('Yape'); expect(c.props.cobroNumero).toBe('999888777');
    c.informarAdelanto('comprador', '/uploads/comprobante.png', '123', AHORA);
    expect(c.props.estado).toBe('AdelantoPendiente'); expect(c.props.comprobanteAdelantoUrl).toBe('/uploads/comprobante.png');
    c.confirmarAdelanto('agricultor', AHORA);
    expect(c.props.estado).toBe('EnCurso');
    c.marcarCompletado('agricultor', AHORA);
    expect(c.props.estado).toBe('Completado');
    expect(c.props.eventos).toHaveLength(5);
  });
  test('solo el agricultor acepta/rechaza; el número debe ser un celular peruano válido para Yape/Plin', () => {
    const c = new ContratoCultivo(base());
    expect(() => c.aceptar('comprador', 'Yape', '999888777')).toThrow(/Solo el agricultor/);
    expect(() => c.aceptar('agricultor', 'Yape', '123')).toThrow(/celular peruano/);
    expect(() => c.aceptar('agricultor', 'Cuenta', 'corta')).toThrow(/cuenta bancaria/);
  });
  test('el agricultor puede rechazar la propuesta en vez de aceptarla', () => {
    const c = new ContratoCultivo(base());
    c.rechazar('agricultor', 'No tengo suficiente cosecha esta temporada', AHORA);
    expect(c.props.estado).toBe('Rechazado');
    expect(() => c.aceptar('agricultor', 'Yape', '999888777')).toThrow(/no corresponde al estado actual/);
  });
  test('no se puede confirmar o rechazar el adelanto sin que el comprador haya subido el comprobante', () => {
    const c = new ContratoCultivo(base({ estado: 'AdelantoPendiente' }));
    expect(() => c.confirmarAdelanto('agricultor')).toThrow(/todavía no subió/);
    expect(() => c.rechazarAdelanto('agricultor', 'motivo real aquí')).toThrow(/todavía no subió/);
  });
  test('el agricultor puede rechazar el comprobante del adelanto y el comprador vuelve a subirlo', () => {
    const c = new ContratoCultivo(base({ estado: 'AdelantoPendiente' }));
    c.informarAdelanto('comprador', '/uploads/x.png', undefined, AHORA);
    c.rechazarAdelanto('agricultor', 'El monto no coincide', AHORA);
    expect(c.props.estado).toBe('AdelantoPendiente'); expect(c.props.comprobanteAdelantoUrl).toBeUndefined();
    c.informarAdelanto('comprador', '/uploads/y.png', undefined, AHORA);
    expect(c.props.comprobanteAdelantoUrl).toBe('/uploads/y.png');
  });
  test('el comprador puede cancelar antes de subir el comprobante, pero no después', () => {
    const c = new ContratoCultivo(base({ estado: 'AdelantoPendiente' }));
    c.informarAdelanto('comprador', '/uploads/x.png', undefined, AHORA);
    expect(() => c.cancelar('comprador', AHORA)).toThrow(/no se puede cancelar/);
    const c2 = new ContratoCultivo(base());
    c2.cancelar('comprador', AHORA);
    expect(c2.props.estado).toBe('Cancelado');
  });
  test('solo el comprador sube el comprobante; solo comprobantes subidos a la plataforma', () => {
    const c = new ContratoCultivo(base({ estado: 'AdelantoPendiente' }));
    expect(() => c.informarAdelanto('agricultor', '/uploads/x.png', undefined)).toThrow(/Solo el comprador/);
    expect(() => c.informarAdelanto('comprador', 'https://otro-sitio.com/x.png', undefined)).toThrow(/Sube la captura/);
  });
});

function repos() {
  const cultivosMem: Record<string, any> = {};
  const plantasMem: Record<string, any> = {};
  const usuarios: Record<string, any> = {};
  const contratosMem: ContratoCultivo[] = [];
  const notificaciones: { destinoId: string; tipo: string; mensaje?: string }[] = [];
  const cultivoRepo = { buscarPorId: async (id: string) => cultivosMem[id] ?? null };
  const plantaRepo = { buscarPorId: async (id: string) => plantasMem[id] ?? null };
  const usuarioRepo = { buscarPorId: async (id: string) => usuarios[id] ?? null };
  const notificador = { notificar: async (destinoId: string, tipo: string, ref?: any) => { notificaciones.push({ destinoId, tipo, mensaje: ref?.mensaje }); } };
  const contratoRepo = {
    guardar: async (c: ContratoCultivo) => { contratosMem.push(c); },
    actualizar: async (_c: ContratoCultivo) => {},
    buscarPorId: async (id: string) => contratosMem.find((c) => c.props.id === id) ?? null,
    listarDe: async (usuarioId: string, rol: 'comprador' | 'agricultor') => contratosMem.filter((c) => (rol === 'comprador' ? c.props.compradorId : c.props.agricultorId) === usuarioId),
  };
  const cultivo = (id: string, over: any = {}) => { cultivosMem[id] = { props: { id, plantaId: 'planta1', autorId: 'agricultor', estadoValidacion: 'Validado', ...over }, puedeMostrarseComoValidado: () => (over.estadoValidacion ?? 'Validado') === 'Validado' }; };
  const planta = (id: string, over: any = {}) => { plantasMem[id] = { props: { id, nombreComun: 'Plátano', ...over } }; };
  const user = (id: string, over: any = {}) => { usuarios[id] = { props: { id, nombre: id, correo: `${id}@x.com`, estado: 'Activo', rol: 'UsuarioRegistrado', ...over } }; };
  return { cultivoRepo, plantaRepo, usuarioRepo, contratoRepo, notificador, notificaciones, cultivo, planta, user };
}
function armarUC() {
  const r = repos();
  r.cultivo('cultivo1'); r.planta('planta1'); r.user('comprador', { nombre: 'Ana' }); r.user('agricultor', { nombre: 'Beto' });
  const uc = new ContratosCultivoUseCase(r.contratoRepo as any, r.cultivoRepo as any, r.plantaRepo as any, r.usuarioRepo as any, r.notificador as any);
  return { uc, r };
}

describe('Casos de uso de contratos de cultivo', () => {
  test('proponer: calcula adelanto 50%, comisión 3% y neto del agricultor; notifica al agricultor', async () => {
    const { uc, r } = armarUC();
    const c = await uc.proponer('comprador', { cultivoId: 'cultivo1', cantidad: '50 kg', montoAcordado: 200 }, AHORA);
    expect(c.props.montoAdelanto).toBe(100); expect(c.props.montoSaldo).toBe(100);
    expect(c.props.comisionReferencial).toBe(6); expect(c.props.netoAgricultor).toBe(194);
    expect(r.notificaciones).toContainEqual(expect.objectContaining({ destinoId: 'agricultor', tipo: 'contrato_cultivo_propuesto' }));
  });
  test('no se puede proponer sobre una ficha no validada, ni proponerse un contrato a uno mismo', async () => {
    const { uc, r } = armarUC();
    r.cultivo('sinValidar', { estadoValidacion: 'Pendiente' });
    await expect(uc.proponer('comprador', { cultivoId: 'sinValidar', cantidad: '10 kg', montoAcordado: 50 })).rejects.toThrow(/no encontrada/);
    await expect(uc.proponer('agricultor', { cultivoId: 'cultivo1', cantidad: '10 kg', montoAcordado: 50 })).rejects.toThrow(/a ti mismo/);
  });
  test('cantidad y monto inválidos se rechazan', async () => {
    const { uc } = armarUC();
    await expect(uc.proponer('comprador', { cultivoId: 'cultivo1', cantidad: 'x', montoAcordado: 50 })).rejects.toThrow(/cantidad/);
    await expect(uc.proponer('comprador', { cultivoId: 'cultivo1', cantidad: '10 kg', montoAcordado: 0 })).rejects.toThrow(/monto acordado/);
  });
  test('un tercero no puede ver el contrato; mismo error para "no existe" y "no es tuyo"', async () => {
    const { uc } = armarUC();
    const c = await uc.proponer('comprador', { cultivoId: 'cultivo1', cantidad: '50 kg', montoAcordado: 200 }, AHORA);
    const tercero: Solicitante = { id: 'x', rol: 'UsuarioRegistrado' };
    await expect(uc.obtener(tercero, c.props.id)).rejects.toThrow(/no encontrado/i);
    await expect(uc.obtener(tercero, 'no-existe')).rejects.toThrow(/no encontrado/i);
  });
  test('acciones disponibles reflejan el estado y el rol de quien pregunta', async () => {
    const { uc } = armarUC();
    const c = await uc.proponer('comprador', { cultivoId: 'cultivo1', cantidad: '50 kg', montoAcordado: 200 }, AHORA);
    const comprador = { id: 'comprador', rol: 'UsuarioRegistrado' }; const agricultor = { id: 'agricultor', rol: 'UsuarioRegistrado' };
    expect((await uc.obtener(comprador, c.props.id)).acciones).toEqual(['cancelar']);
    expect((await uc.obtener(agricultor, c.props.id)).acciones).toEqual(expect.arrayContaining(['aceptar', 'rechazar']));
    await uc.aceptar(agricultor, c.props.id, 'Yape', '999888777', AHORA);
    expect((await uc.obtener(comprador, c.props.id)).acciones).toEqual(expect.arrayContaining(['informarAdelanto', 'cancelar']));
    await uc.informarAdelanto(comprador, c.props.id, '/uploads/x.png', undefined, AHORA);
    expect((await uc.obtener(agricultor, c.props.id)).acciones).toEqual(expect.arrayContaining(['confirmarAdelanto', 'rechazarAdelanto']));
    await uc.confirmarAdelanto(agricultor, c.props.id, AHORA);
    expect((await uc.obtener(agricultor, c.props.id)).acciones).toEqual(['marcarCompletado']);
    await uc.marcarCompletado(agricultor, c.props.id, AHORA);
    expect((await uc.obtener(comprador, c.props.id)).estado).toBe('Completado');
  });
  test('listarMios muestra el resumen para comprador y agricultor', async () => {
    const { uc } = armarUC();
    await uc.proponer('comprador', { cultivoId: 'cultivo1', cantidad: '50 kg', montoAcordado: 200 }, AHORA);
    const misPropuestas = await uc.listarMios('comprador', 'comprador');
    expect(misPropuestas).toHaveLength(1); expect(misPropuestas[0]).toMatchObject({ plantaNombre: 'Plátano', montoAcordado: 200, con: 'Beto' });
    const recibidas = await uc.listarMios('agricultor', 'agricultor');
    expect(recibidas).toHaveLength(1); expect(recibidas[0].con).toBe('Ana');
  });
});
