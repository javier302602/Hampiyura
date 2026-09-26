// Límite de mensajes por usuario (o por IP si no hay sesión) en memoria: por minuto y por día. Configurable por entorno
// (ASISTENTE_LIMITE_POR_MINUTO / ASISTENTE_LIMITE_POR_DIA). Es un freno básico contra abuso y costo, no un sistema de cuotas.
export interface ResultadoLimite { ok: boolean; motivo?: string }
export class LimitadorAsistente {
  private readonly usos = new Map<string, number[]>();
  constructor(private readonly porMinuto: number, private readonly porDia: number, private readonly ahora: () => number = () => Date.now()) {}
  permitir(clave: string): ResultadoLimite {
    const t = this.ahora();
    const previos = (this.usos.get(clave) ?? []).filter((x) => t - x < 24 * 60 * 60 * 1000);
    if (previos.filter((x) => t - x < 60 * 1000).length >= this.porMinuto) return { ok: false, motivo: 'Enviaste muchos mensajes seguidos. Espera un minuto y vuelve a intentar.' };
    if (previos.length >= this.porDia) return { ok: false, motivo: 'Llegaste al límite de mensajes de hoy con el asistente. Puedes enviar tu pregunta a un especialista.' };
    previos.push(t); this.usos.set(clave, previos);
    return { ok: true };
  }
}
