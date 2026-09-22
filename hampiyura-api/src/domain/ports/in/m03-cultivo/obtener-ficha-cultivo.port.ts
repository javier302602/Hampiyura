import { Cultivo } from '../../../entities/cultivo.entity';
import { EstadoValidacion } from '../../../value-objects/estado-validacion.vo';

// RF-251, criterio de aceptación: ningún dato agronómico se muestra si no fue validado
// por un especialista; en ese caso solo se expone el estado y un mensaje de espera.
export type FichaCultivoVisible =
  | ({ disponible: true } & Cultivo['props'])
  | { disponible: false; id: string; plantaId: string; estadoValidacion: EstadoValidacion; mensaje: string };

export interface ObtenerFichaCultivoPort { ejecutar(id: string): Promise<FichaCultivoVisible>; }
