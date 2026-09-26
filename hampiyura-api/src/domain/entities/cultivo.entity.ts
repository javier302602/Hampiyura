import { Fuente } from '../value-objects/fuente.vo';
import { EstadoValidacion } from '../value-objects/estado-validacion.vo';
import { UnauthorizedError, ValidationError } from '../errors/domain.errors';
import { CalendarioCultivo } from '../value-objects/calendario-cultivo.vo';
export interface CultivoProps { id: string; plantaId: string; autorId: string; zonaCultivo: string; condicionesClimaticas: string; tipoSuelo: string; altitudAprox: string; aguaNecesaria: string; exposicionSolar: string; epocaSiembra: string; metodoPropagacion: string; tiempoCrecimiento: string; cuidados: string; plagasComunes: string; epocaCosecha: string; recomendacionesSobreexplotacion: string; consejosRecoleccion: string; calendario: CalendarioCultivo; fuente: Fuente; estadoValidacion: EstadoValidacion;
  // Ronda 19: guía de cultivo de un especialista en agronomía. Null/ausente = pendiente; nunca se rellena por el sistema.
  guiaSuelo?: string | null; guiaNutrientes?: string | null; guiaHerramientas?: string | null; guiaEspecialistaId?: string | null; guiaActualizadaEn?: Date | null; }

export interface GuiaCultivoInput { suelo?: string | null; nutrientes?: string | null; herramientas?: string | null; }
export const MAX_GUIA = 1500;
export class Cultivo {
  constructor(public readonly props: CultivoProps) {}
  // Solo un Especialista en agronomía (o un Administrador) escribe la guía. Cada campo es opcional y se puede dejar
  // vacío (queda "pendiente"); si se escribe, debe ser contenido real, no una palabra suelta.
  actualizarGuia(input: GuiaCultivoInput, especialistaId: string, rol: string, fecha: Date): void {
    if (rol !== 'Administrador' && rol !== 'EspecialistaAgronomo') throw new UnauthorizedError('Solo un especialista en agronomía (o un administrador) puede redactar la guía de cultivo');
    const limpio = (v: string | null | undefined, nombre: string): string | null => {
      const t = v?.trim();
      if (!t) return null;
      if (t.length < 10) throw new ValidationError(`${nombre}: escribe al menos 10 caracteres reales o déjalo vacío`);
      if (t.length > MAX_GUIA) throw new ValidationError(`${nombre}: máximo ${MAX_GUIA} caracteres`);
      return t;
    };
    this.props.guiaSuelo = limpio(input.suelo, 'Suelo o tierra');
    this.props.guiaNutrientes = limpio(input.nutrientes, 'Nutrientes');
    this.props.guiaHerramientas = limpio(input.herramientas, 'Herramientas');
    const vacia = !this.props.guiaSuelo && !this.props.guiaNutrientes && !this.props.guiaHerramientas;
    this.props.guiaEspecialistaId = vacia ? null : especialistaId;
    this.props.guiaActualizadaEn = vacia ? null : fecha;
  }

  puedeMostrarseComoValidado(): boolean { return this.props.estadoValidacion === 'Validado'; }
}
