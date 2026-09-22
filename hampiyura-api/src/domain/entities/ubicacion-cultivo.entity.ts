// RF-271: pin geográfico de un cultivo real sobre el mapa de distribución. Es un registro de
// actividad (dónde se cultiva), no una afirmación científica -- mismo criterio que
// AccionConservacion (RF-268): no exige Fuente ni pasa por M-09.
//
// RN-07 (mismo principio que EstadoConservacion.zona, ver estado-conservacion.entity.ts): si la
// planta está en riesgo, NUNCA se guardan ni se exponen coordenadas exactas, solo `zona` (texto
// amplio). Esta entidad admite latitud/longitud opcionales -- quien decide si se guardan o se
// exponen es el caso de uso (RegistrarUbicacionCultivoUseCase / ListarMapaCultivoUseCase), que
// conoce el estado de conservación vigente de la planta.
export interface UbicacionCultivoProps {
  id: string;
  cultivoId: string;
  plantaId: string;
  autorId: string;
  zona: string;
  latitud: number | null;
  longitud: number | null;
  fecha: Date;
}

export class UbicacionCultivo {
  constructor(public readonly props: UbicacionCultivoProps) {}
  tieneCoordenadasExactas(): boolean { return this.props.latitud !== null && this.props.longitud !== null; }
}
