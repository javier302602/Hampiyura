import { ModeloLenguajePort, MensajeChat } from '../../../../domain/ports/out/modelo-lenguaje.port';

const sinAcentos = (t: string) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const tokens = (t: string) => sinAcentos(t).split(/[^a-z0-9ñ]+/).filter((x) => x.length >= 4);
const bloque = (texto: string, ini: string, fin: string) => { const a = texto.indexOf(ini); const b = texto.indexOf(fin); return a >= 0 && b > a ? texto.slice(a + ini.length, b).trim() : ''; };

// MODO SIMULADO: sin clave de IA. No inventa nada: solo recompone lo que ya viene en el contexto (plantas validadas o resumen de la
// plataforma). Sirve para probar el flujo completo (recuperación, avisos, escalado) sin costo. Toda respuesta va marcada.
export class SimuladoModeloAdapter implements ModeloLenguajePort {
  readonly simulado = true;
  readonly nombre = 'Simulado (sin proveedor de IA)';
  async generar(sistema: string, mensajes: MensajeChat[]): Promise<string> {
    const pregunta = mensajes.filter((m) => m.rol === 'user').slice(-1)[0]?.contenido ?? '';
    const plantas = bloque(sistema, '<<PLANTAS>>', '<<FIN_PLANTAS>>');
    // El marcador "(ninguna planta relevante...)" no es contenido: en ese caso se responde solo con el resumen de la plataforma.
    if (plantas && !plantas.startsWith('(ninguna')) return `[Modo simulado] Esto es lo que HampiYura tiene validado sobre tu pregunta:\n${plantas}`;
    const q = new Set(tokens(pregunta));
    const lineas = bloque(sistema, '<<PLATAFORMA>>', '<<FIN_PLATAFORMA>>').split('\n').filter((l) => l.trim());
    const puntuadas = lineas.map((l) => ({ l, n: tokens(l).filter((t) => q.has(t)).length })).filter((x) => x.n > 0).sort((a, b) => b.n - a.n).slice(0, 3);
    if (puntuadas.length === 0) return '[SIN_DATOS]';
    return `[Modo simulado] Sobre cómo funciona HampiYura:\n${puntuadas.map((x) => x.l).join('\n')}`;
  }
}
