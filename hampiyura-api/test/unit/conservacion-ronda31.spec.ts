import { CONSERVACION } from '../../scripts/datos-conservacion';
import { FICHAS_PLANTAS } from '../../scripts/datos-fichas-plantas';
import { categoriaDeRiesgo, estaEnRiesgo, plantasEnRiesgo, EvaluacionConservacion } from '../../src/domain/value-objects/evaluacion-conservacion.vo';

// Ronda 31: estado de conservación (IUCN + D.S. 043-2006-AG). Fuente única: docs/plantas medicinales/HAMPIYURA_Estado_Conservacion_27_Especies.md
const bins = Object.keys(CONSERVACION);
describe('Estado de conservación · datos', () => {
  test('hay una evaluación por cada una de las 27 plantas de las fichas', () => {
    expect(bins).toHaveLength(27);
    expect(new Set(bins)).toEqual(new Set(FICHAS_PLANTAS.map((f) => f.bin)));
  });
  test('"No evaluada" (NE) se guarda literalmente; nunca hay un dato vacío que se leería como "sin riesgo"', () => {
    for (const bin of bins.filter((b) => b !== 'Ficus insipida')) {
      const e = CONSERVACION[bin];
      expect({ bin, iucn: !!e.iucn?.categoria, peru: !!e.peru?.categoria }).toEqual({ bin, iucn: true, peru: true });
      expect(e.iucn!.fuente).toMatch(/IUCN/); expect(e.peru!.norma).toMatch(/043-2006-AG/);
    }
    expect(CONSERVACION['Uncaria tomentosa'].iucn!.categoria).toBe('NE');
  });
  test('Ojé: contradicción sin resolver -> NUNCA una categoría, solo el texto de pendiente', () => {
    const oje = CONSERVACION['Ficus insipida'];
    expect(oje.iucn).toBeUndefined(); expect(oje.peru).toBeUndefined();
    expect(oje.pendiente).toBe('Estado de conservación: pendiente de confirmación directa en iucnredlist.org.');
    expect(categoriaDeRiesgo(oje)).toBeNull();
    // aunque alguien le agregara una categoría de riesgo, con `pendiente` sigue sin mostrarse
    expect(categoriaDeRiesgo({ ...oje, iucn: { categoria: 'CR', fuente: 'x' } })).toBeNull();
  });
  test('solo Hercampuri tiene riesgo confirmado (CR en Perú, EN en IUCN); las otras 26 no', () => {
    const enRiesgo = bins.filter((b) => estaEnRiesgo(CONSERVACION[b]));
    expect(enRiesgo).toEqual(['Gentianella alborosea']);
    const h = CONSERVACION['Gentianella alborosea'];
    expect(categoriaDeRiesgo(h)).toBe('CR');
    expect(h.iucn!.categoria).toBe('EN'); expect(h.peru!.categoria).toBe('CR');
    expect(h.peru!.fuente).toMatch(/PromPerú/); expect(h.peru!.anio).toBe('2006');
    expect(bins.filter((b) => !estaEnRiesgo(CONSERVACION[b]))).toHaveLength(26);
  });
  test('Café: el EN de IUCN es de poblaciones silvestres, va con su aclaración y no cuenta como planta en riesgo', () => {
    const c = CONSERVACION['Coffea arabica'];
    expect(c.iucn).toMatchObject({ categoria: 'EN', anio: '2020', soloSilvestre: true });
    expect(c.iucn!.aclaracion).toMatch(/SILVESTRES.*Etiopía.*Sudán del Sur.*no del café cultivado/);
    expect(estaEnRiesgo(c)).toBe(false);
  });
  test('Cacao es "Datos Insuficientes" (no "sin riesgo") y no cuenta como riesgo ni "LC"', () => {
    expect(CONSERVACION['Theobroma cacao'].iucn!.categoria).toBe('DD');
    expect(estaEnRiesgo(CONSERVACION['Theobroma cacao'])).toBe(false);
  });
  test('Sangre de grado: aviso de identidad con las 5 especies emparentadas NT; C. lechleri NO recibe ese NT', () => {
    const s = CONSERVACION['Croton lechleri'];
    for (const sp of ['draconoides', 'erythrochilus', 'palanostigma', 'perspeciosus', 'sampatik']) expect(s.avisoIdentidad).toContain(sp);
    expect(s.avisoIdentidad).toMatch(/NO corresponde a C\. lechleri/);
    expect(s.iucn!.categoria).toBe('NE'); expect(s.peru!.categoria).toBe('NF');
    expect(estaEnRiesgo(s)).toBe(false);
  });
  test('Copaiba y Yacón: no se usan las evaluaciones de otras especies (C. langsdorffii, S. glabratus)', () => {
    expect(CONSERVACION['Copaifera spp.'].iucn!.categoria).toBe('NE');
    expect(CONSERVACION['Smallanthus sonchifolius'].iucn!.categoria).toBe('NE');
  });
});

describe('Estado de conservación · sección del inicio y etiqueta', () => {
  const plantas = bins.map((b) => ({ bin: b, evaluacionConservacion: CONSERVACION[b] as EvaluacionConservacion | undefined }));
  test('hoy la sección del inicio tiene solo a Hercampuri; la etiqueta no sale en ninguna de las otras 26', () => {
    expect(plantasEnRiesgo(plantas).map((p) => p.bin)).toEqual(['Gentianella alborosea']);
  });
  test('si no califica ninguna planta, la lista queda vacía (el inicio no muestra el bloque)', () => {
    const sinRiesgo = plantas.filter((p) => p.bin !== 'Gentianella alborosea');
    expect(plantasEnRiesgo(sinRiesgo)).toEqual([]);
    expect(plantasEnRiesgo([])).toEqual([]);
    expect(plantasEnRiesgo([{ evaluacionConservacion: undefined }])).toEqual([]);
  });
  test('la sección crece sola: una planta nueva con VU/EN/CR confirmado aparece sin tocar código; NE, DD, LC y NT no', () => {
    const nueva = (categoria: 'VU' | 'EN' | 'CR' | 'NT' | 'DD' | 'LC' | 'NE') => ({ evaluacionConservacion: { iucn: { categoria, fuente: 'IUCN' } } as EvaluacionConservacion });
    expect(plantasEnRiesgo([nueva('VU'), nueva('EN'), nueva('CR'), nueva('NT'), nueva('DD'), nueva('LC'), nueva('NE')])).toHaveLength(3);
    expect(categoriaDeRiesgo({ peru: { categoria: 'VU', fuente: 'DS', norma: 'DS' } })).toBe('VU');
  });
});

// RN-07: la ubicación exacta nunca se guarda para una planta en riesgo -- ahora también por el estado de referencia (Hercampuri).
import { RegistrarUbicacionCultivoUseCase } from '../../src/application/m03-cultivo/registrar-ubicacion-cultivo.use-case';
describe('Estado de conservación · RN-07 (ubicación exacta)', () => {
  const armar = (evaluacion?: EvaluacionConservacion) => {
    const guardadas: any[] = [];
    const uc = new RegistrarUbicacionCultivoUseCase(
      { guardar: async (u: any) => { guardadas.push(u); } } as any,
      { buscarPorId: async () => ({ props: { plantaId: 'pl1' } }) } as any,
      { buscarValidadoPorPlanta: async () => null } as any,
      { buscarPorId: async () => ({ props: { evaluacionConservacion: evaluacion } }) } as any,
    );
    return { uc, guardadas };
  };
  test('Hercampuri (CR/EN): se guarda solo la zona, sin coordenadas', async () => {
    const { uc, guardadas } = armar(CONSERVACION['Gentianella alborosea']);
    await uc.ejecutar({ cultivoId: 'c1', autorId: 'u1', zona: 'Junín', latitud: -11.5, longitud: -75.2 } as any);
    expect(guardadas[0].props.latitud).toBeNull(); expect(guardadas[0].props.longitud).toBeNull();
  });
  test('una planta sin riesgo confirmado (Uña de gato, Café solo silvestre, Ojé pendiente) conserva sus coordenadas', async () => {
    for (const bin of ['Uncaria tomentosa', 'Coffea arabica', 'Ficus insipida']) {
      const { uc, guardadas } = armar(CONSERVACION[bin]);
      await uc.ejecutar({ cultivoId: 'c1', autorId: 'u1', zona: 'Leoncio Prado', latitud: -9.3, longitud: -76 } as any);
      expect({ bin, lat: guardadas[0].props.latitud }).toEqual({ bin, lat: -9.3 });
    }
  });
});
