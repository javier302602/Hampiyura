import { Fuente } from '../value-objects/fuente.vo';
import { EstadoValidacion } from '../value-objects/estado-validacion.vo';
import { UnauthorizedError, ValidationError } from '../errors/domain.errors';
import { CAMPOS_GUIA, GuiaCultivoDatos, MAX_CAMPO_GUIA, agroquimicoPeligrosoEn } from '../value-objects/guia-cultivo.vo';
import { CalendarioCultivo } from '../value-objects/calendario-cultivo.vo';
export interface CultivoProps { id: string; plantaId: string; autorId: string; zonaCultivo: string; condicionesClimaticas: string; tipoSuelo: string; altitudAprox: string; aguaNecesaria: string; exposicionSolar: string; epocaSiembra: string; metodoPropagacion: string; tiempoCrecimiento: string; cuidados: string; plagasComunes: string; epocaCosecha: string; recomendacionesSobreexplotacion: string; consejosRecoleccion: string; calendario: CalendarioCultivo; fuente: Fuente; estadoValidacion: EstadoValidacion;
  // Ronda 19: guía de cultivo de un especialista en agronomía. Null/ausente = pendiente; nunca se rellena por el sistema.
  guia?: GuiaCultivoDatos | null; guiaEspecialistaId?: string | null; guiaActualizadaEn?: Date | null; }

export type GuiaCultivoInput = Partial<Record<string, string | null>>;
export class Cultivo {
  constructor(public readonly props: CultivoProps) {}
  // Solo un Especialista en agronomía (o un Administrador) escribe la guía. Cada campo es opcional y se puede dejar
  // vacío (queda "pendiente"); si se escribe, debe ser contenido real, no una palabra suelta.
  actualizarGuia(input: GuiaCultivoInput, especialistaId: string, rol: string, fecha: Date): void {
    if (rol !== 'Administrador' && rol !== 'EspecialistaAgronomo') throw new UnauthorizedError('Solo un especialista en agronomía (o un administrador) puede redactar la guía de cultivo');
    const desconocida = Object.keys(input).find((k) => !CAMPOS_GUIA.some((c) => c.clave === k));
    if (desconocida) throw new ValidationError(`Campo de guía desconocido: ${desconocida}`);
    const guia: GuiaCultivoDatos = {};
    for (const c of CAMPOS_GUIA) {
      const t = input[c.clave]?.trim();
      if (!t) continue; // vacío = pendiente
      if (t.length < c.minimo) throw new ValidationError(`${c.seccion} · ${c.etiqueta}: escribe al menos ${c.minimo} caracteres reales o déjalo vacío`);
      if (t.length > MAX_CAMPO_GUIA) throw new ValidationError(`${c.seccion} · ${c.etiqueta}: máximo ${MAX_CAMPO_GUIA} caracteres`);
      const peligroso = agroquimicoPeligrosoEn(t);
      if (peligroso) throw new ValidationError(`${c.seccion} · ${c.etiqueta}: no se recomiendan agroquímicos peligrosos (${peligroso}). Propón manejo cultural, biológico u orgánico`);
      guia[c.clave] = t;
    }
    const vacia = Object.keys(guia).length === 0;
    this.props.guia = vacia ? null : guia;
    this.props.guiaEspecialistaId = vacia ? null : especialistaId;
    this.props.guiaActualizadaEn = vacia ? null : fecha;
  }

  puedeMostrarseComoValidado(): boolean { return this.props.estadoValidacion === 'Validado'; }
}
