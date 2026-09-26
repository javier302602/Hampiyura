import { Cultivo } from '../../src/domain/entities/cultivo.entity';
import { ActualizarGuiaCultivoUseCase } from '../../src/application/m03-cultivo/guia-cultivo.use-case';
import { aVistaFichaCultivo } from '../../src/application/m03-cultivo/obtener-ficha-cultivo.use-case';
import { CAMPOS_GUIA, agroquimicoPeligrosoEn } from '../../src/domain/value-objects/guia-cultivo.vo';
import { Fuente } from '../../src/domain/value-objects/fuente.vo';
import { CalendarioCultivo } from '../../src/domain/value-objects/calendario-cultivo.vo';

function ficha(estado: any = 'Pendiente') {
  return new Cultivo({ id: 'c1', plantaId: 'p1', autorId: 'a1', zonaCultivo: 'Zona', condicionesClimaticas: 'x', tipoSuelo: 'x', altitudAprox: 'x', aguaNecesaria: 'x', exposicionSolar: 'x', epocaSiembra: 'x', metodoPropagacion: 'x', tiempoCrecimiento: 'x', cuidados: 'x', plagasComunes: 'x', epocaCosecha: 'x', recomendacionesSobreexplotacion: 'x', consejosRecoleccion: 'x', calendario: new CalendarioCultivo([1], [2]), fuente: new Fuente('Fuente de prueba'), estadoValidacion: estado });
}
const repoCon = (c: Cultivo) => ({ buscarPorId: jest.fn().mockResolvedValue(c), actualizarGuia: jest.fn() }) as any;
const suelo = 'Suelo franco-arenoso, bien drenado.';

describe('Guía de cultivo completa (Rondas 19 y 22)', () => {
  test('la guía cubre los apartados pedidos, agrupados en secciones', () => {
    expect([...new Set(CAMPOS_GUIA.map((c) => c.seccion))]).toEqual(['Suelo', 'Nutrientes', 'Calendario', 'Espaciamiento', 'Riego', 'Clima', 'Plagas y enfermedades', 'Herramientas', 'Cosecha']);
    expect(CAMPOS_GUIA.map((c) => c.clave)).toEqual(expect.arrayContaining(['suelo', 'ph', 'drenaje', 'nutrientes', 'enmiendas', 'epocaSiembra', 'cicloCosecha', 'germinacion', 'espaciamiento', 'riego', 'temperatura', 'altitud', 'precipitacion', 'plagas', 'herramientas', 'indicadoresCosecha']));
  });
  test('nace VACÍA: todos los campos null y 0 completados (nada inventado)', () => {
    for (const estado of ['Pendiente', 'Validado']) {
      const v: any = aVistaFichaCultivo(ficha(estado));
      expect(Object.values(v.guia.campos).every((x) => x === null)).toBe(true);
      expect(v.guia).toMatchObject({ completada: 0, total: CAMPOS_GUIA.length, actualizadaEn: null });
      expect(JSON.stringify(v)).not.toContain('guiaEspecialistaId');
    }
  });
  test('un Especialista en agronomía y un Administrador la redactan; lo escrito se ve y lo demás sigue pendiente', async () => {
    for (const rol of ['EspecialistaAgronomo', 'Administrador']) {
      const c = ficha(); const repo = repoCon(c);
      await new ActualizarGuiaCultivoUseCase(repo).ejecutar('c1', { suelo, ph: '5,5 a 6,5', riego: 'Riego ligero cada 2 o 3 días en época seca.', plagas: '' }, { id: 'e1', rol });
      expect(repo.actualizarGuia).toHaveBeenCalledTimes(1);
      const v: any = aVistaFichaCultivo(c);
      expect(v.guia.campos).toMatchObject({ suelo, ph: '5,5 a 6,5', plagas: null, herramientas: null });
      expect(v.guia.completada).toBe(3);
      expect(v.guia.actualizadaEn).toBeInstanceOf(Date);
    }
  });
  test('cualquier otro rol es rechazado y no se guarda nada', async () => {
    for (const rol of ['EspecialistaSalud', 'EspecialistaConservacion', 'Productor', 'UsuarioRegistrado', 'Visitante']) {
      const c = ficha(); const repo = repoCon(c);
      await expect(new ActualizarGuiaCultivoUseCase(repo).ejecutar('c1', { suelo }, { id: 'x', rol })).rejects.toThrow(/agronomía/);
      expect(repo.actualizarGuia).not.toHaveBeenCalled();
      expect(c.props.guia).toBeUndefined();
    }
  });
  test('texto de relleno muy corto, demasiado largo o un campo que no existe se rechazan', async () => {
    const uc = new ActualizarGuiaCultivoUseCase(repoCon(ficha())); const yo = { id: 'e1', rol: 'EspecialistaAgronomo' };
    await expect(uc.ejecutar('c1', { suelo: 'tierra' }, yo)).rejects.toThrow(/10 caracteres/);
    await expect(uc.ejecutar('c1', { ph: '5' }, yo)).rejects.toThrow(/3 caracteres/);
    await expect(uc.ejecutar('c1', { suelo: 'x'.repeat(1501) }, yo)).rejects.toThrow(/máximo/);
    await expect(uc.ejecutar('c1', { inventado: 'algo de relleno' }, yo)).rejects.toThrow(/desconocido/);
  });
  test('cultivo responsable: rechaza recomendar agroquímicos peligrosos, acepta manejo cultural/orgánico', async () => {
    const uc = new ActualizarGuiaCultivoUseCase(repoCon(ficha())); const yo = { id: 'e1', rol: 'EspecialistaAgronomo' };
    for (const mal of ['Aplicar glifosato cada mes contra las malezas.', 'Controlar con Paraquat antes de sembrar.', 'Usar clorpirifos en el cuello de la planta.']) {
      await expect(uc.ejecutar('c1', { plagas: mal }, yo)).rejects.toThrow(/agroquímicos peligrosos/);
    }
    await expect(uc.ejecutar('c1', { plagas: 'Manejo cultural: rotación, trampas con feromonas y extracto de neem.' }, yo)).resolves.toBeDefined();
    expect(agroquimicoPeligrosoEn('El tratamiento paraquatificado')).toBeUndefined(); // no confunde palabras que solo contienen el nombre
  });
  test('se puede vaciar una guía ya escrita (vuelve a pendiente) y una ficha inexistente da error', async () => {
    const c = ficha(); const uc = new ActualizarGuiaCultivoUseCase(repoCon(c));
    await uc.ejecutar('c1', { suelo }, { id: 'e1', rol: 'Administrador' });
    await uc.ejecutar('c1', {}, { id: 'e1', rol: 'Administrador' });
    expect((aVistaFichaCultivo(c) as any).guia.completada).toBe(0);
    await expect(new ActualizarGuiaCultivoUseCase({ buscarPorId: jest.fn().mockResolvedValue(null) } as any).ejecutar('zz', {}, { id: 'e1', rol: 'Administrador' })).rejects.toThrow(/no encontrada/);
  });
});
