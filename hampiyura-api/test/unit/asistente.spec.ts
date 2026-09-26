import { ConsultarAsistenteUseCase } from '../../src/application/m12-busqueda-recomendaciones/asistente.use-cases';
import { RESUMEN_PLATAFORMA } from '../../src/application/m12-busqueda-recomendaciones/asistente-plataforma';
import { SimuladoModeloAdapter } from '../../src/infrastructure/adapters/out/ia/simulado-modelo.adapter';
import { LimitadorAsistente } from '../../src/infrastructure/adapters/out/ia/limitador-asistente';

const planta = (id: string, nombreComun: string, nombreCientifico: string, validado = true) => ({ props: { id, nombreComun, nombreCientifico, familia: 'Rubiaceae', habitat: 'Selva tropical' }, esVisiblePublicamente: () => validado });
const parte = (usoId: string, motivoUso: string, tipo: string, estado = 'Validado', verificado = false) => ({ props: { estadoValidacion: estado, usoId, parte: 'Hoja', motivoUso, tipoConocimiento: tipo, fuente: { valor: 'Saber comunitario de prueba' } }, puedeMostrarseComoVerificado: () => verificado });
const ficha = (guia: any, validada = true) => ({ props: { guia }, puedeMostrarseComoValidado: () => validada });

function armar(respuestaModelo: string | Error = 'Respuesta basada en el contexto.') {
  const usos = [{ props: { id: 'u-dig', nombre: 'Digestivo' } }, { props: { id: 'u-resp', nombre: 'Respiratorio' } }, { props: { id: 'u-odo', nombre: 'Odontológico' } }];
  const plantas = [planta('p1', 'Uña de gato', 'Uncaria tomentosa'), planta('p2', 'Sangre de grado', 'Croton lechleri'), planta('p3', 'Planta pendiente', 'Pendientis testus', false)];
  const partes: Record<string, any[]> = {
    p1: [parte('u-dig', 'Infusión de la hoja para el malestar de estómago', 'Tradicional'), parte('u-resp', 'Uso pendiente que NO debe salir', 'Tradicional', 'Pendiente')],
    p2: [parte('u-resp', 'Resina para la tos', 'Científico', 'Validado', true)],
    p3: [parte('u-dig', 'Uso de una planta no validada', 'Tradicional')],
  };
  const fichas: Record<string, any[]> = { p1: [ficha({ suelo: 'Suelo franco, bien drenado (dato de prueba)' }), ficha({ riego: 'GUÍA DE FICHA NO VALIDADA' }, false)], p2: [], p3: [] };
  const generar = jest.fn(async () => { if (respuestaModelo instanceof Error) throw respuestaModelo; return respuestaModelo; });
  const modelo: any = { simulado: false, nombre: 'falso', generar };
  const uc = new ConsultarAsistenteUseCase({ listar: async () => plantas } as any, { listarPorPlanta: async (id: string) => partes[id] ?? [] } as any, { listar: async () => usos } as any, { listarPorPlanta: async (id: string) => fichas[id] ?? [] } as any, modelo);
  return { uc, generar, sistema: () => (generar.mock.calls[0] as any[])[0] as string };
}

describe('Asistente · plantas: solo con lo validado en la base', () => {
  test('pregunta sobre un síntoma con datos: el contexto trae SOLO lo validado (nada pendiente) y el servidor agrega el aviso de no verificado', async () => {
    const { uc, generar, sistema } = armar();
    const r = await uc.ejecutar('¿Qué planta sirve para el dolor de estómago?');
    expect(generar).toHaveBeenCalledTimes(1);
    const ctx = sistema().slice(sistema().indexOf('<<PLANTAS>>'));
    expect(ctx).toContain('Uña de gato');
    expect(ctx).toContain('Tradicional, no verificado científicamente');
    expect(ctx).not.toMatch(/Planta pendiente|no validada|NO debe salir/);
    expect(r.escalar).toBe(false);
    expect(r.respuesta).toMatch(/NO verificadas científicamente/); // aviso agregado por el servidor, no por el modelo
    expect(r.fuentes).toEqual([{ planta: 'Uña de gato', tipos: ['Tradicional'] }]);
  });
  test('un uso Científico verificado se presenta como verificado; no se le pone aviso de no verificado', async () => {
    const { uc, sistema } = armar();
    const r = await uc.ejecutar('¿Para qué sirve la sangre de grado?');
    expect(sistema()).toContain('Científico VERIFICADO');
    expect(r.respuesta).not.toMatch(/NO verificadas/);
    expect(r.fuentes[0].tipos).toEqual(['Científico (verificado)']);
  });
  test('la guía de cultivo entra solo si la ficha está validada, y el aviso aclara que no es permiso legal', async () => {
    const { uc, sistema } = armar();
    const r = await uc.ejecutar('¿Cómo cultivo la uña de gato?');
    expect(sistema()).toContain('Suelo franco, bien drenado');
    expect(sistema()).not.toContain('GUÍA DE FICHA NO VALIDADA');
    expect(r.respuesta).toMatch(/No es un permiso legal/);
  });
  test('pregunta sobre una planta o síntoma que la base NO cubre: NO llama al modelo y ofrece escalar con la pregunta precargada', async () => {
    for (const pregunta of ['¿Qué propiedades tiene la planta zzz inexistente?', '¿Qué sirve para el dolor de muela?', 'Cuéntame sobre el ginseng']) {
      const { uc, generar } = armar();
      const r = await uc.ejecutar(pregunta);
      expect(generar).not.toHaveBeenCalled();
      expect(r).toMatchObject({ escalar: true, consultaSugerida: pregunta, modo: 'sin-modelo', fuentes: [] });
      expect(r.respuesta).toMatch(/No tengo ese dato/);
    }
  });
  test('si el modelo dice [SIN_DATOS] se escala; si el proveedor falla también, sin romper', async () => {
    const a = armar('[SIN_DATOS]'); const ra = await a.uc.ejecutar('¿Qué sirve para el estómago?');
    expect(ra).toMatchObject({ escalar: true, consultaSugerida: '¿Qué sirve para el estómago?' });
    const b = armar(new Error('proveedor caído')); const rb = await b.uc.ejecutar('¿Qué sirve para el estómago?');
    expect(rb.escalar).toBe(true); expect(rb.respuesta).toMatch(/no pude consultar/);
  });
  test('el prompt del sistema impone las reglas de no inventar y la distinción de tipo de conocimiento', async () => {
    const { uc, sistema } = armar();
    await uc.ejecutar('¿Qué sirve para el estómago?');
    for (const regla of ['ÚNICAMENTE con la información de este contexto', 'NO completes con conocimiento general', 'Tradicional, Documentado o Científico', '[SIN_DATOS]']) expect(sistema()).toContain(regla);
  });
});

describe('Asistente · ayuda de la plataforma y escalado', () => {
  test('pregunta de navegación: el modelo recibe el resumen de la plataforma y NINGÚN dato de plantas', async () => {
    const { uc, generar, sistema } = armar('Para proponer una planta inicia sesión y usa el botón "Proponer planta".');
    const r = await uc.ejecutar('¿Cómo propongo una planta nueva?');
    expect(generar).toHaveBeenCalledTimes(1);
    expect(sistema()).toContain(RESUMEN_PLATAFORMA.slice(0, 40));
    expect(sistema().slice(sistema().indexOf('<<PLANTAS>>'))).toContain('(ninguna planta relevante en la base)');
    expect(r.escalar).toBe(false);
  });
  test('si piden hablar con una persona: se escala directo, sin modelo', async () => {
    const { uc, generar } = armar();
    const r = await uc.ejecutar('Quiero hablar con un humano');
    expect(generar).not.toHaveBeenCalled();
    expect(r).toMatchObject({ escalar: true, modo: 'sin-modelo', consultaSugerida: 'Quiero hablar con un humano' });
  });
  test('valida la entrada: vacía o demasiado larga se rechaza', async () => {
    const { uc } = armar();
    await expect(uc.ejecutar('   ')).rejects.toThrow(/Escribe tu pregunta/);
    await expect(uc.ejecutar('x'.repeat(501))).rejects.toThrow(/demasiado larga/);
  });
});

describe('Asistente · modo simulado y límite de uso', () => {
  test('el modo simulado solo recompone el contexto y va marcado; sin contexto útil devuelve [SIN_DATOS]', async () => {
    const m = new SimuladoModeloAdapter();
    expect(m.simulado).toBe(true);
    const conPlantas = await m.generar('<<PLANTAS>>\nPlanta: X\n<<FIN_PLANTAS>>', [{ rol: 'user', contenido: 'hola' }]);
    expect(conPlantas).toMatch(/^\[Modo simulado\]/); expect(conPlantas).toContain('Planta: X');
    const nav = await m.generar(`<<PLATAFORMA>>\n${RESUMEN_PLATAFORMA}\n<<FIN_PLATAFORMA>>\n<<PLANTAS>>\n<<FIN_PLANTAS>>`, [{ rol: 'user', contenido: '¿Cómo propongo una planta nueva?' }]);
    expect(nav).toMatch(/^\[Modo simulado\]/); expect(nav).toMatch(/Proponer una planta/);
    expect(await m.generar('<<PLATAFORMA>>\nSolo esto.\n<<FIN_PLATAFORMA>>\n<<PLANTAS>>\n<<FIN_PLANTAS>>', [{ rol: 'user', contenido: 'algo totalmente distinto' }])).toBe('[SIN_DATOS]');
  });
  test('el resumen de la plataforma solo describe funciones que existen (no promete mensajería directa ni alertas)', () => {
    expect(RESUMEN_PLATAFORMA).not.toMatch(/mensajería directa|alertas de disponibilidad/i);
    expect(RESUMEN_PLATAFORMA).toMatch(/Proponer una planta/);
  });
  test('límite por minuto y por día, por usuario, y se puede ajustar', () => {
    let t = 0; const l = new LimitadorAsistente(2, 3, () => t);
    expect(l.permitir('a').ok).toBe(true); expect(l.permitir('a').ok).toBe(true);
    const bloqueado = l.permitir('a'); expect(bloqueado.ok).toBe(false); expect(bloqueado.motivo).toMatch(/un minuto/);
    expect(l.permitir('b').ok).toBe(true); // otro usuario no se ve afectado
    t += 61_000; expect(l.permitir('a').ok).toBe(true); // pasado el minuto
    t += 61_000; const dia = l.permitir('a'); expect(dia.ok).toBe(false); expect(dia.motivo).toMatch(/hoy/); // 3 en el día
    t += 24 * 3600_000; expect(l.permitir('a').ok).toBe(true);
  });
});

describe('Asistente · modo simulado con pregunta de ayuda', () => {
  test('sin plantas relevantes el simulado responde con el resumen de la plataforma, no con el marcador vacío', async () => {
    const r = await new SimuladoModeloAdapter().generar(`<<PLATAFORMA>>\n${RESUMEN_PLATAFORMA}\n<<FIN_PLATAFORMA>>\n<<PLANTAS>>\n(ninguna planta relevante en la base)\n<<FIN_PLANTAS>>`, [{ rol: 'user', contenido: '¿Cómo propongo una planta nueva?' }]);
    expect(r).toMatch(/Proponer una planta nueva/);
    expect(r).not.toMatch(/ninguna planta relevante/);
  });
});
