import { ParteUso } from '../../src/domain/entities/parte-uso.entity';
import { Fuente } from '../../src/domain/value-objects/fuente.vo';
import { ProponerPlantaUseCase } from '../../src/application/m02-catalogo-plantas/catalogo-plantas.use-cases';
import { ListarSeguimientoUseCase, ObtenerSeguimientoUseCase, RegistrarValidacionCientificaUseCase, ActualizarContactoSeguimientoUseCase } from '../../src/application/m04-usos-partes/seguimiento-cientifico.use-cases';
import { aVistaParteUso } from '../../src/application/m04-usos-partes/partes-uso.use-cases';

const EVIDENCIA_OK = 'Ensayo de laboratorio con extracto de hoja: reducción medible de la inflamación en cultivo celular (n=3).';
function parte(over: Partial<ParteUso['props']> = {}) {
  return new ParteUso({ id: 'pu1', plantaId: 'p1', autorId: 'u1', parte: 'Hoja', usoId: 'uso1', tipoConocimiento: 'Tradicional', fuente: new Fuente('saber comunitario'), estadoValidacion: 'Validado', ...over });
}
const hoy = () => new Date();

describe('Validación científica de un uso Tradicional (entidad)', () => {
  test('camino completo: Tradicional aprobado + evidencia concreta -> Científico y se muestra como verificado', () => {
    const p = parte();
    expect(p.puedeMostrarseComoVerificado()).toBe(false);
    p.registrarValidacionCientifica({ especialista: 'Laboratorio de Fitoquímica UNAS', fecha: new Date('2026-08-01'), evidencia: EVIDENCIA_OK, enlace: 'https://doi.org/10.1234/x', registradaPorId: 'admin' });
    expect(p.props.tipoConocimiento).toBe('Científico');
    expect(p.props.validacionCientifica).toMatchObject({ especialista: 'Laboratorio de Fitoquímica UNAS', registradaPorId: 'admin' });
    expect(p.puedeMostrarseComoVerificado()).toBe(true);
    expect(p.etiquetaAdvertencia()).toBeNull();
  });
  test('rechaza evidencia vacía o genérica ("se probó") aunque el campo no esté vacío', () => {
    for (const evidencia of ['', '   ', 'Se probó', 'se validó.', 'Está comprobado', 'funciona', 'corta pero no genérica']) {
      const p = parte();
      expect(() => p.registrarValidacionCientifica({ especialista: 'Lab UNAS', fecha: hoy(), evidencia, registradaPorId: 'a' })).toThrow(/detalle concreto/);
      expect(p.props.tipoConocimiento).toBe('Tradicional');
    }
  });
  test('exige especialista, fecha válida no futura y un enlace bien formado si se da', () => {
    const base = { especialista: 'Lab UNAS', fecha: hoy(), evidencia: EVIDENCIA_OK, registradaPorId: 'a' };
    expect(() => parte().registrarValidacionCientifica({ ...base, especialista: ' ' })).toThrow(/especialista/i);
    expect(() => parte().registrarValidacionCientifica({ ...base, fecha: new Date('nope') })).toThrow(/fecha/i);
    expect(() => parte().registrarValidacionCientifica({ ...base, fecha: new Date(Date.now() + 10 * 86400000) })).toThrow(/futura/i);
    expect(() => parte().registrarValidacionCientifica({ ...base, enlace: 'javascript:alert(1)' })).toThrow(/enlace/i);
    expect(() => parte().registrarValidacionCientifica({ ...base, enlace: '/uploads/estudio.pdf' })).not.toThrow();
  });
  test('aplica a Tradicional, Documentado y Científico YA APROBADOS sin evidencia, y una sola vez', () => {
    const base = { especialista: 'Lab UNAS', fecha: hoy(), evidencia: EVIDENCIA_OK, registradaPorId: 'a' };
    expect(() => parte({ estadoValidacion: 'Pendiente' }).registrarValidacionCientifica(base)).toThrow(/aprobarse/);
    expect(() => parte({ tipoConocimiento: 'Pendiente' }).registrarValidacionCientifica(base)).toThrow(/Pendiente/);
    for (const tipo of ['Tradicional', 'Documentado', 'Científico'] as const) {
      const p = parte({ tipoConocimiento: tipo });
      expect(p.puedeRegistrarValidacionCientifica()).toBe(true);
      p.registrarValidacionCientifica(base);
      expect(p.props.tipoConocimiento).toBe('Científico');
      expect(p.puedeMostrarseComoVerificado()).toBe(true);
      expect(p.puedeRegistrarValidacionCientifica()).toBe(false);
      expect(() => p.registrarValidacionCientifica(base)).toThrow(/ya tiene/);
    }
  });
  test('sin atajo: declarar "Científico" al proponer NO da sello; solo lo da el registro con evidencia', () => {
    const p = parte({ tipoConocimiento: 'Científico' });
    expect(p.puedeMostrarseComoVerificado()).toBe(false);
    expect(() => p.registrarValidacionCientifica({ especialista: 'Lab UNAS', fecha: hoy(), evidencia: 'se probó', registradaPorId: 'a' })).toThrow(/detalle concreto/);
    expect(p.puedeMostrarseComoVerificado()).toBe(false);
  });
  test('RF-257: aprobar en moderación NO basta: "Científico" declarado sin evidencia no es verificado', () => {
    expect(parte({ tipoConocimiento: 'Científico' }).puedeMostrarseComoVerificado()).toBe(false);
  });
  test('contacto de seguimiento: teléfono o correo válidos, solo en Tradicional aprobado', () => {
    const p = parte();
    p.actualizarContactoSeguimiento(' +51 987 654 321 '); expect(p.props.contactoSeguimiento).toBe('+51 987 654 321');
    p.actualizarContactoSeguimiento('dra.perez@unas.edu.pe'); expect(p.props.contactoSeguimiento).toBe('dra.perez@unas.edu.pe');
    expect(() => p.actualizarContactoSeguimiento('quien sabe')).toThrow(/teléfono o un correo/);
    p.actualizarContactoSeguimiento(''); expect(p.props.contactoSeguimiento).toBeUndefined();
    expect(() => parte({ estadoValidacion: 'Pendiente' }).actualizarContactoSeguimiento('999999999')).toThrow(/aprobarse/);
  });
  test('el contacto de seguimiento también aplica a Documentado y Científico sin evidencia', () => {
    for (const tipo of ['Documentado', 'Científico'] as const) { const p = parte({ tipoConocimiento: tipo }); p.actualizarContactoSeguimiento('999999999'); expect(p.props.contactoSeguimiento).toBe('999999999'); }
    expect(() => parte({ tipoConocimiento: 'Pendiente' }).actualizarContactoSeguimiento('999999999')).toThrow(/Pendiente/);
  });
  test('la vista PÚBLICA nunca trae el contacto interno ni el detalle de la evidencia', () => {
    const p = parte({ contactoSeguimiento: '999999999' });
    p.registrarValidacionCientifica({ especialista: 'Lab UNAS', fecha: hoy(), evidencia: EVIDENCIA_OK, registradaPorId: 'a' });
    const v: any = aVistaParteUso(p);
    expect(v.verificado).toBe(true);
    expect(v).not.toHaveProperty('contactoSeguimiento');
    expect(v).not.toHaveProperty('validacionCientifica');
  });
});

describe('Casos de uso de seguimiento (roles y flujo)', () => {
  function armar(p = parte()) {
    const partes: any = { buscarPorId: jest.fn().mockResolvedValue(p), actualizar: jest.fn(), listar: jest.fn().mockResolvedValue([p, parte({ id: 'pu2', estadoValidacion: 'Pendiente' }), parte({ id: 'pu3', tipoConocimiento: 'Documentado' })]) };
    const plantas: any = { buscarPorId: jest.fn().mockResolvedValue({ props: { nombreComun: 'Uña de gato' } }) };
    const usos: any = { buscarPorId: jest.fn().mockResolvedValue({ props: { nombre: 'Antiinflamatorio' } }) };
    const usuarios: any = { buscarPorId: jest.fn().mockResolvedValue({ props: { nombre: 'Ana' } }) };
    const notificador: any = { notificar: jest.fn() };
    return { p, partes, plantas, usos, usuarios, notificador };
  }
  test('solo Especialista en salud o Administrador (un usuario normal o un agrónomo no)', async () => {
    const a = armar();
    for (const rol of ['UsuarioRegistrado', 'EspecialistaAgronomo', 'Productor']) {
      await expect(new ListarSeguimientoUseCase(a.partes, a.plantas, a.usos, a.usuarios).ejecutar(rol)).rejects.toThrow(/Especialista en salud/);
      await expect(new ActualizarContactoSeguimientoUseCase(a.partes, a.plantas, a.usos, a.usuarios).ejecutar('pu1', rol, '999999999')).rejects.toThrow();
    }
    // pu1 Tradicional + pu3 Documentado (aprobados, sin evidencia); pu2 está Pendiente y no aparece.
    await expect(new ListarSeguimientoUseCase(a.partes, a.plantas, a.usos, a.usuarios).ejecutar('EspecialistaSalud')).resolves.toHaveLength(2);
  });
  test('registrar guarda, cambia el tipo y avisa a quien aportó el conocimiento', async () => {
    const a = armar();
    await new RegistrarValidacionCientificaUseCase(a.partes, a.plantas, a.usos, a.usuarios, a.notificador).ejecutar('pu1', { id: 'admin1', rol: 'Administrador' }, { especialista: 'Lab UNAS', fecha: new Date('2026-08-01'), evidencia: EVIDENCIA_OK });
    expect(a.partes.actualizar).toHaveBeenCalled();
    expect(a.p.props.tipoConocimiento).toBe('Científico');
    expect(a.notificador.notificar).toHaveBeenCalledWith('u1', 'validacion_cientifica_registrada', expect.anything());
    const det = await new ObtenerSeguimientoUseCase(a.partes, a.plantas, a.usos, a.usuarios).ejecutar('pu1', 'Administrador');
    expect(det.validacionCientifica).toMatchObject({ especialista: 'Lab UNAS', registradaPorNombre: 'Ana' });
    expect(det.puedeRegistrarValidacionCientifica).toBe(false);
  });
  test('un fallo de validación no cambia nada ni notifica', async () => {
    const a = armar();
    await expect(new RegistrarValidacionCientificaUseCase(a.partes, a.plantas, a.usos, a.usuarios, a.notificador).ejecutar('pu1', { id: 'admin1', rol: 'Administrador' }, { especialista: 'Lab', fecha: new Date(), evidencia: 'se probó' })).rejects.toThrow();
    expect(a.partes.actualizar).not.toHaveBeenCalled(); expect(a.notificador.notificar).not.toHaveBeenCalled();
    expect(a.p.props.tipoConocimiento).toBe('Tradicional');
  });
});

describe('Proponer planta con VARIAS partes medicinales', () => {
  const plantaInput: any = { nombreComun: 'Uña de gato', nombreCientifico: 'Uncaria tomentosa', familia: 'Rubiaceae', region: 'Selva', habitat: 'Selva tropical' };
  const bloque = (parte: string, usoId: string, extra: any = {}) => ({ parte, usoId, motivoUso: 'Se usa en infusión para tratar molestias', tipoConocimiento: 'Tradicional', fuente: new Fuente('comunidad'), ...extra });
  function uc() {
    const repo: any = { guardar: jest.fn() }; const validaciones: any = { guardar: jest.fn() };
    const registrar: any = { ejecutar: jest.fn() }; const usos: any = { buscarPorId: jest.fn().mockResolvedValue({ props: {} }) };
    return { u: new ProponerPlantaUseCase(repo, validaciones, registrar, usos), repo, registrar };
  }
  test('cada bloque se registra por separado (su propio Planta→Parte→Uso) con el mismo proponente', async () => {
    const { u, registrar } = uc();
    const planta = await u.ejecutar({ ...plantaInput, proponenteId: 'u1', partesUso: [bloque('Hoja', 'uso1'), bloque('Raíz', 'uso2'), bloque('Otra', 'uso3', { parteDetalle: 'Látex' })] });
    expect(registrar.ejecutar).toHaveBeenCalledTimes(3);
    expect(registrar.ejecutar.mock.calls.map((c: any) => c[0].parte)).toEqual(['Hoja', 'Raíz', 'Otra']);
    expect(registrar.ejecutar.mock.calls.every((c: any) => c[0].plantaId === planta.props.id && c[0].autorId === 'u1')).toBe(true);
  });
  test('si UN bloque es inválido no se guarda nada (ni la planta ni los otros bloques)', async () => {
    const { u, repo, registrar } = uc();
    await expect(u.ejecutar({ ...plantaInput, proponenteId: 'u1', partesUso: [bloque('Hoja', 'uso1'), bloque('Raíz', 'uso2', { motivoUso: '  ' })] })).rejects.toThrow(/para qué/i);
    expect(repo.guardar).not.toHaveBeenCalled(); expect(registrar.ejecutar).not.toHaveBeenCalled();
  });
  test('rechaza más de 8 bloques y la misma parte+uso repetida', async () => {
    const { u } = uc();
    await expect(u.ejecutar({ ...plantaInput, proponenteId: 'u1', partesUso: Array.from({ length: 9 }, (_, i) => bloque('Hoja', `uso${i}`)) })).rejects.toThrow(/hasta 8/);
    await expect(u.ejecutar({ ...plantaInput, proponenteId: 'u1', partesUso: [bloque('Hoja', 'uso1'), bloque('Hoja', 'uso1')] })).rejects.toThrow(/misma parte/);
    await expect(u.ejecutar({ ...plantaInput, proponenteId: 'u1', partesUso: [bloque('Hoja', 'uso1'), bloque('Hoja', 'uso2')] })).resolves.toBeDefined();
  });
});
