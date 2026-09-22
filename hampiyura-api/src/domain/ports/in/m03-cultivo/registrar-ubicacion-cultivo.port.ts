import { UbicacionCultivo } from '../../../entities/ubicacion-cultivo.entity';
export interface RegistrarUbicacionCultivoInput {
  cultivoId: string;
  autorId: string;
  zona: string;
  latitud?: number;
  longitud?: number;
}
export interface RegistrarUbicacionCultivoPort { ejecutar(input: RegistrarUbicacionCultivoInput): Promise<UbicacionCultivo>; }
