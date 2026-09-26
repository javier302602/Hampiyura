import { PlantaRepositoryPort } from '../../domain/ports/out/planta.repository.port';
import { ParteUsoRepositoryPort } from '../../domain/ports/out/parte-uso.repository.port';
import { UsoRepositoryPort } from '../../domain/ports/out/uso.repository.port';
import { CultivoRepositoryPort } from '../../domain/ports/out/cultivo.repository.port';
import { ModeloLenguajePort, MensajeChat } from '../../domain/ports/out/modelo-lenguaje.port';
import { CAMPOS_GUIA } from '../../domain/value-objects/guia-cultivo.vo';
import { RESUMEN_PLATAFORMA } from './asistente-plataforma';
import { ValidationError } from '../../domain/errors/domain.errors';

// Asistente de ayuda (Ronda 27). REGLA QUE NO SE NEGOCIA: sobre plantas solo se responde con lo que YA está cargado y validado en HampiYura
// (RF-252/RF-257 de la plataforma); jamás con conocimiento general del modelo. Por eso:
//   1) el contexto se arma en el servidor solo con datos validados de la base;
//   2) si no hay contexto de plantas para una pregunta que no es de ayuda, NO se llama al modelo: se responde "no tengo ese dato" y se ofrece escalar;
//   3) el aviso de "sugerencia no verificada" (Tradicional/Documentado) lo agrega el SERVIDOR, no el modelo, así que no se puede omitir.

export interface RespuestaAsistente {
  respuesta: string;
  escalar: boolean;              // true = ofrecer con énfasis "Enviar consulta" a un especialista
  consultaSugerida: string;      // texto ya listo para precargar en "Enviar consulta"
  fuentes: { planta: string; tipos: string[] }[];
  modo: 'real' | 'simulado' | 'sin-modelo';
}
export interface ContextoPlanta {
  nombreComun: string; nombreCientifico: string; familia: string; habitat: string;
  usos: { parte: string; uso: string; motivo: string; tipo: string; fuente: string; contraindicaciones?: string; verificado: boolean }[];
  guia: { etiqueta: string; valor: string }[];
}

const sinAcentos = (t: string) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const PARRAFOS_VACIOS = new Set(['planta', 'plantas', 'sirve', 'sirven', 'para', 'como', 'cual', 'cuales', 'donde', 'tiene', 'tengo', 'quiero', 'puedo', 'hacer', 'algo', 'sobre', 'hampiyura', 'esta', 'este', 'que', 'con', 'una', 'uno', 'los', 'las', 'del', 'por', 'usar', 'usan']);
const tokens = (t: string) => sinAcentos(t).split(/[^a-z0-9ñ]+/).filter((x) => x.length >= 4 && !PARRAFOS_VACIOS.has(x));

// Palabra de la pregunta -> nombre del uso del catálogo (solo para ENCONTRAR registros en la base; no aporta ningún contenido médico).
const SINONIMOS_USO: Record<string, string[]> = {
  estomago: ['Digestivo'], digestion: ['Digestivo'], digestivo: ['Digestivo'], diarrea: ['Digestivo'], gastritis: ['Digestivo'], colico: ['Digestivo'], panza: ['Digestivo'], intestino: ['Digestivo'], empacho: ['Digestivo'],
  tos: ['Respiratorio'], gripe: ['Respiratorio'], bronquitis: ['Respiratorio'], asma: ['Respiratorio'], pulmon: ['Respiratorio'], respirar: ['Respiratorio'], garganta: ['Respiratorio'], resfrio: ['Respiratorio'],
  inflamacion: ['Antiinflamatorio'], hinchazon: ['Antiinflamatorio'], artritis: ['Antiinflamatorio'],
  dolor: ['Analgésico'], cabeza: ['Analgésico'], muscular: ['Analgésico'], migrana: ['Analgésico'],
  fiebre: ['Antipirético/Febrífugo'], calentura: ['Antipirético/Febrífugo'],
  herida: ['Cicatrizante'], heridas: ['Cicatrizante'], cicatriz: ['Cicatrizante'], quemadura: ['Cicatrizante'],
  piel: ['Dermatológico'], acne: ['Dermatológico'], eczema: ['Dermatológico'],
  higado: ['Hepatoprotector'], hepatico: ['Hepatoprotector'],
  presion: ['Cardiovascular'], corazon: ['Cardiovascular'], colesterol: ['Cardiovascular'],
  orina: ['Diurético', 'Urológico'], rinon: ['Diurético', 'Urológico'], rinones: ['Diurético', 'Urológico'], vejiga: ['Urológico'],
  nervios: ['Sedante/Relajante'], ansiedad: ['Sedante/Relajante'], sueno: ['Sedante/Relajante'], insomnio: ['Sedante/Relajante'], estres: ['Sedante/Relajante'],
  hongos: ['Antifúngico'], hongo: ['Antifúngico'], parasitos: ['Antiparasitario'], lombrices: ['Antiparasitario'],
  infeccion: ['Antimicrobiano/Antibacteriano'], bacterias: ['Antimicrobiano/Antibacteriano'],
  ojos: ['Oftálmico'], vista: ['Oftálmico'], dientes: ['Odontológico'], muela: ['Odontológico'], encias: ['Odontológico'],
  defensas: ['Inmunoestimulante'], inmunidad: ['Inmunoestimulante'],
};
const RE_AYUDA = /(como (propongo|registro|creo|publico|uso|funciona|envio|contacto|cambio|inicio|me registro|entro|activo|desbloqueo|pago|pagar)|donde (veo|encuentro|esta|estan|puedo|queda)|plataforma|hampiyura|directorio|planes?\b|precio|cuesta|cuenta\b|perfil|registr|enviar consulta|mis consultas|productor|comision|desbloque|ayuda|que es |ficha de cultivo|mapa|notificacion|yape|plin|iniciar sesion|contrasena)/;
const RE_HUMANO = /(humano|persona real|hablar con (alguien|un|una)|especialista|asesor|soporte)/;

export interface OpcionesAsistente { maxPlantas: number; maxUsosPorPlanta: number }

export class ConsultarAsistenteUseCase {
  constructor(
    private readonly plantas: PlantaRepositoryPort, private readonly partesUso: ParteUsoRepositoryPort, private readonly usos: UsoRepositoryPort,
    private readonly cultivos: CultivoRepositoryPort, private readonly modelo: ModeloLenguajePort,
    private readonly opciones: OpcionesAsistente = { maxPlantas: 3, maxUsosPorPlanta: 4 },
  ) {}

  // Recuperación: SOLO plantas validadas, usos validados y guías de fichas validadas. Devuelve además si alguna coincidió por nombre.
  async recuperar(pregunta: string): Promise<{ contextos: ContextoPlanta[]; porNombre: boolean }> {
    const q = sinAcentos(pregunta);
    const toks = new Set(tokens(pregunta));
    const plantas = (await this.plantas.listar()).filter((p) => p.esVisiblePublicamente());
    const catalogo = await this.usos.listar();
    const nombresUso = new Map(catalogo.map((u) => [u.props.id, u.props.nombre]));
    const usosBuscados = new Set<string>();
    for (const t of toks) for (const nombre of SINONIMOS_USO[t] ?? []) usosBuscados.add(nombre);
    for (const u of catalogo) if (tokens(u.props.nombre).some((t) => toks.has(t))) usosBuscados.add(u.props.nombre);

    const puntuadas: { planta: (typeof plantas)[number]; puntos: number; porNombre: boolean; partes: Awaited<ReturnType<ParteUsoRepositoryPort['listarPorPlanta']>> }[] = [];
    for (const p of plantas) {
      const partes = (await this.partesUso.listarPorPlanta(p.props.id)).filter((x) => x.props.estadoValidacion === 'Validado');
      const nombres = [p.props.nombreComun, p.props.nombreCientifico].map(sinAcentos);
      const porNombre = nombres.some((n) => q.includes(n)) || tokens(p.props.nombreComun).some((t) => toks.has(t)) || tokens(p.props.nombreCientifico).some((t) => toks.has(t));
      let puntos = porNombre ? 10 : 0;
      for (const x of partes) {
        if (usosBuscados.has(nombresUso.get(x.props.usoId) ?? '')) puntos += 3;
        puntos += tokens(x.props.motivoUso ?? '').filter((t) => toks.has(t)).length;
      }
      if (puntos > 0) puntuadas.push({ planta: p, puntos, porNombre, partes });
    }
    puntuadas.sort((a, b) => b.puntos - a.puntos);
    const elegidas = puntuadas.slice(0, this.opciones.maxPlantas);
    const contextos: ContextoPlanta[] = [];
    for (const e of elegidas) {
      const fichas = (await this.cultivos.listarPorPlanta(e.planta.props.id)).filter((c) => c.puedeMostrarseComoValidado());
      const guia: ContextoPlanta['guia'] = [];
      for (const f of fichas) for (const c of CAMPOS_GUIA) { const v = f.props.guia?.[c.clave]; if (v) guia.push({ etiqueta: `${c.seccion} · ${c.etiqueta}`, valor: v }); }
      contextos.push({
        nombreComun: e.planta.props.nombreComun, nombreCientifico: e.planta.props.nombreCientifico, familia: e.planta.props.familia, habitat: e.planta.props.habitat,
        usos: e.partes.slice(0, this.opciones.maxUsosPorPlanta).map((x) => ({
          parte: x.props.parte === 'Otra' && x.props.parteDetalle ? x.props.parteDetalle : x.props.parte, uso: nombresUso.get(x.props.usoId) ?? '', motivo: x.props.motivoUso ?? '',
          tipo: x.props.tipoConocimiento, fuente: x.props.fuente.valor, contraindicaciones: x.props.contraindicaciones || undefined, verificado: x.puedeMostrarseComoVerificado(),
        })),
        guia,
      });
    }
    return { contextos, porNombre: elegidas.some((e) => e.porNombre) };
  }

  private textoContexto(cs: ContextoPlanta[]): string {
    return cs.map((c) => [
      `Planta: ${c.nombreComun} (${c.nombreCientifico}), familia ${c.familia}, hábitat: ${c.habitat}`,
      ...(c.usos.length ? c.usos.map((u) => `  Uso [${u.verificado ? 'Científico VERIFICADO' : u.tipo + ', no verificado científicamente'}]: parte ${u.parte}, para ${u.uso}. ${u.motivo}. Fuente: ${u.fuente}.${u.contraindicaciones ? ' Contraindicaciones: ' + u.contraindicaciones + '.' : ''}`) : ['  (sin usos validados cargados)']),
      ...(c.guia.length ? ['  Guía de cultivo (redactada por un especialista en agronomía):', ...c.guia.map((g) => `    - ${g.etiqueta}: ${g.valor}`)] : ['  Guía de cultivo: (vacía, aún sin completar por un especialista)']),
    ].join('\n')).join('\n');
  }

  private sistema(cs: ContextoPlanta[]): string {
    return [
      'Eres el asistente de ayuda de HampiYura, una plataforma de plantas medicinales de la Amazonía peruana. Respondes en español, claro y breve.',
      'REGLAS OBLIGATORIAS:',
      '1. Responde ÚNICAMENTE con la información de este contexto. Si no está aquí, di que no tienes ese dato. NO completes con conocimiento general sobre ninguna planta, uso, dosis ni cultivo, aunque lo sepas.',
      '2. Sobre plantas usa SOLO el bloque PLANTAS. Sobre cómo usar HampiYura usa SOLO el bloque PLATAFORMA. No inventes secciones, precios, botones ni funciones que no aparezcan.',
      '3. Al citar un uso, di siempre su tipo (Tradicional, Documentado o Científico verificado) tal como aparece; nunca lo presentes como verificado si el contexto no lo dice.',
      '4. No des diagnósticos, dosis ni indicaciones médicas. Nunca sugieras agroquímicos peligrosos.',
      '5. Si el contexto no alcanza para responder, responde EXACTAMENTE: [SIN_DATOS]',
      '<<PLATAFORMA>>', RESUMEN_PLATAFORMA, '<<FIN_PLATAFORMA>>',
      '<<PLANTAS>>', cs.length ? this.textoContexto(cs) : '(ninguna planta relevante en la base)', '<<FIN_PLANTAS>>',
    ].join('\n');
  }

  // Avisos que agrega el SERVIDOR (no dependen de que el modelo se acuerde).
  private avisos(cs: ContextoPlanta[]): string {
    if (cs.length === 0) return '';
    const l: string[] = [];
    const noVerif = cs.filter((c) => c.usos.some((u) => !u.verificado));
    if (noVerif.length) l.push(`Ojo: los usos de ${noVerif.map((c) => c.nombreComun).join(', ')} que figuran como Tradicional o Documentado son sugerencias NO verificadas científicamente. No reemplazan la consulta con un profesional de la salud.`);
    if (cs.some((c) => c.guia.length)) l.push('La guía de cultivo la redacta un especialista en agronomía. No es un permiso legal: cultivar o cosechar plantas silvestres nativas puede requerir autorización de SERFOR.');
    return l.join('\n');
  }

  async ejecutar(mensaje: string, historial: MensajeChat[] = []): Promise<RespuestaAsistente> {
    const pregunta = mensaje?.trim();
    if (!pregunta) throw new ValidationError('Escribe tu pregunta');
    if (pregunta.length > 500) throw new ValidationError('La pregunta es demasiado larga (máximo 500 caracteres)');
    const escalarDirecto = (texto: string): RespuestaAsistente => ({ respuesta: texto, escalar: true, consultaSugerida: pregunta, fuentes: [], modo: 'sin-modelo' });
    const q = sinAcentos(pregunta);
    if (RE_HUMANO.test(q) && !/plantas? .*especialista|especialista en/.test(q)) return escalarDirecto('Claro. Puedes enviar tu pregunta al equipo de especialistas de HampiYura y te responderán por ahí. Ya dejé tu pregunta lista para enviar.');

    const { contextos, porNombre } = await this.recuperar(pregunta);
    const esAyuda = RE_AYUDA.test(q);
    // Pregunta de ayuda que no nombra ninguna planta: solo el resumen de la plataforma, sin datos de plantas.
    const usados = esAyuda && !porNombre ? [] : contextos;
    if (usados.length === 0 && !esAyuda) {
      return escalarDirecto('No tengo ese dato en la información validada de HampiYura, y no quiero inventarlo. Puedes enviar tu pregunta a un especialista: la dejé lista para que no tengas que escribirla otra vez.');
    }
    const mensajes: MensajeChat[] = [...historial.slice(-6), { rol: 'user' as const, contenido: pregunta }];
    let texto: string;
    try { texto = await this.modelo.generar(this.sistema(usados), mensajes); }
    catch { return escalarDirecto('En este momento no pude consultar al asistente. Puedes enviar tu pregunta a un especialista: la dejé lista para enviar.'); }
    if (!texto || texto.includes('[SIN_DATOS]')) {
      return { respuesta: 'No tengo ese dato en la información validada de HampiYura, y no quiero inventarlo. Puedes enviar tu pregunta a un especialista: la dejé lista para que no tengas que escribirla otra vez.', escalar: true, consultaSugerida: pregunta, fuentes: [], modo: this.modelo.simulado ? 'simulado' : 'real' };
    }
    const avisos = this.avisos(usados);
    return {
      respuesta: avisos ? `${texto}\n\n${avisos}` : texto, escalar: false, consultaSugerida: pregunta,
      fuentes: usados.map((c) => ({ planta: c.nombreComun, tipos: [...new Set(c.usos.map((u) => (u.verificado ? 'Científico (verificado)' : u.tipo)))] })),
      modo: this.modelo.simulado ? 'simulado' : 'real',
    };
  }
}
