import { Consulta } from '../../../entities/consulta.entity';

// RF-263: tipo y descripción son obligatorios; autorId es opcional (visitante sin cuenta puede
// enviar una consulta general). prioridad/areaAsignada/estado NO se reciben del cliente -- los
// calcula el propio caso de uso (RN-06 y el enrutamiento por tipo), nunca los decide quien pregunta.
export interface CrearConsultaInput {
  tipo: string;
  descripcion: string;
  autorId?: string;
  imagenes?: string[];
  latitud?: number;
  longitud?: number;
}
export interface CrearConsultaPort { ejecutar(input: CrearConsultaInput): Promise<Consulta>; }
