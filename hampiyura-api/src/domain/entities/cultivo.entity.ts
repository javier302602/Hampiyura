import { Fuente } from '../value-objects/fuente.vo';
import { EstadoValidacion } from '../value-objects/estado-validacion.vo';
import { CalendarioCultivo } from '../value-objects/calendario-cultivo.vo';
export interface CultivoProps { id: string; plantaId: string; autorId: string; zonaCultivo: string; condicionesClimaticas: string; tipoSuelo: string; altitudAprox: string; aguaNecesaria: string; exposicionSolar: string; epocaSiembra: string; metodoPropagacion: string; tiempoCrecimiento: string; cuidados: string; plagasComunes: string; epocaCosecha: string; recomendacionesSobreexplotacion: string; consejosRecoleccion: string; calendario: CalendarioCultivo; fuente: Fuente; estadoValidacion: EstadoValidacion; }
export class Cultivo {
  constructor(public readonly props: CultivoProps) {}
  puedeMostrarseComoValidado(): boolean { return this.props.estadoValidacion === 'Validado'; }
}
