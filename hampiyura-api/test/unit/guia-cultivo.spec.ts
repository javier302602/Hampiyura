import { Cultivo } from '../../src/domain/entities/cultivo.entity';
import { ActualizarGuiaCultivoUseCase } from '../../src/application/m03-cultivo/guia-cultivo.use-case';
import { aVistaFichaCultivo } from '../../src/application/m03-cultivo/obtener-ficha-cultivo.use-case';
import { Fuente } from '../../src/domain/value-objects/fuente.vo';
import { CalendarioCultivo } from '../../src/domain/value-objects/calendario-cultivo.vo';

function ficha(estado: any = 'Pendiente') {
  return new Cultivo({ id: 'c1', plantaId: 'p1', autorId: 'a1', zonaCultivo: 'Zona', condicionesClimaticas: 'x', tipoSuelo: 'x', altitudAprox: 'x', aguaNecesaria: 'x', exposicionSolar: 'x', epocaSiembra: 'x', metodoPropagacion: 'x', tiempoCrecimiento: 'x', cuidados: 'x', plagasComunes: 'x', epocaCosecha: 'x', recomendacionesSobreexplotacion: 'x', consejosRecoleccion: 'x', calendario: new CalendarioCultivo([1], [2]), fuente: new Fuente('Fuente de prueba'), estadoValidacion: estado });
}
const repoCon = (c: Cultivo) => ({ buscarPorId: jest.fn().mockResolvedValue(c), actualizarGuia: jest.fn() }) as any;
const texto = 'Suelo franco-arenoso, bien drenado, pH entre 5,5 y 6,5.';

describe('Guía de cultivo (Ronda 19)', () => {
  test('nace VACÍA: la vista pública dice pendiente (todo null), nunca contenido inventado', () => {
    for (const estado of ['Pendiente', 'Validado']) {
      const v: any = aVistaFichaCultivo(ficha(estado));
      expect(v.guia).toEqual({ suelo: null, nutrientes: null, herramientas: null, actualizadaEn: null });
      expect(JSON.stringify(v)).not.toContain('guiaEspecialistaId');
    }
  });
  test('un Especialista en agronomía y un Administrador pueden redactarla; queda visible para cualquiera', async () => {
    for (const rol of ['EspecialistaAgronomo', 'Administrador']) {
      const c = ficha(); const repo = repoCon(c);
      await new ActualizarGuiaCultivoUseCase(repo).ejecutar('c1', { suelo: texto, nutrientes: 'Nitrógeno y potasio en fase de crecimiento.', herramientas: null }, { id: 'e1', rol });
      expect(repo.actualizarGuia).toHaveBeenCalledTimes(1);
      const v: any = aVistaFichaCultivo(c);
      expect(v.guia).toMatchObject({ suelo: texto, herramientas: null });
      expect(v.guia.actualizadaEn).toBeInstanceOf(Date);
    }
  });
  test('cualquier otro rol (salud, conservación, productor, usuario) es rechazado y no se guarda nada', async () => {
    for (const rol of ['EspecialistaSalud', 'EspecialistaConservacion', 'Productor', 'UsuarioRegistrado', 'Visitante']) {
      const c = ficha(); const repo = repoCon(c);
      await expect(new ActualizarGuiaCultivoUseCase(repo).ejecutar('c1', { suelo: texto }, { id: 'x', rol })).rejects.toThrow(/agronomía/);
      expect(repo.actualizarGuia).not.toHaveBeenCalled();
      expect(c.props.guiaSuelo).toBeUndefined();
    }
  });
  test('texto vacío o de relleno demasiado corto no cuenta: los campos vacíos se quedan pendientes; muy largo se rechaza', async () => {
    const c = ficha(); const uc = new ActualizarGuiaCultivoUseCase(repoCon(c));
    await uc.ejecutar('c1', { suelo: '   ', nutrientes: '', herramientas: undefined }, { id: 'e1', rol: 'EspecialistaAgronomo' });
    expect(c.props).toMatchObject({ guiaSuelo: null, guiaNutrientes: null, guiaHerramientas: null, guiaEspecialistaId: null, guiaActualizadaEn: null });
    await expect(uc.ejecutar('c1', { suelo: 'tierra' }, { id: 'e1', rol: 'EspecialistaAgronomo' })).rejects.toThrow(/10 caracteres/);
    await expect(uc.ejecutar('c1', { suelo: 'x'.repeat(1501) }, { id: 'e1', rol: 'EspecialistaAgronomo' })).rejects.toThrow(/máximo/);
  });
  test('se puede vaciar una guía ya escrita (vuelve a pendiente) y ficha inexistente da error', async () => {
    const c = ficha(); const uc = new ActualizarGuiaCultivoUseCase(repoCon(c));
    await uc.ejecutar('c1', { suelo: texto }, { id: 'e1', rol: 'Administrador' });
    await uc.ejecutar('c1', {}, { id: 'e1', rol: 'Administrador' });
    expect((aVistaFichaCultivo(c) as any).guia.suelo).toBeNull();
    await expect(new ActualizarGuiaCultivoUseCase({ buscarPorId: jest.fn().mockResolvedValue(null) } as any).ejecutar('zz', {}, { id: 'e1', rol: 'Administrador' })).rejects.toThrow(/no encontrada/);
  });
});
