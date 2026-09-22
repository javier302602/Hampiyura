import { Planta } from '../../../entities/planta.entity';
import { EstadoConservacionVisible } from '../../../ports/in/m10-conservacion/obtener-estado-conservacion.port';

// RF-269: la ficha de planta de M-02 se enriquece con el resumen de conservación de M-10 en vez
// de duplicar el endpoint. `conservacion.disponible=false` siempre trae el texto literal de
// RF-267 ("no determinado — pendiente de fuente oficial"), nunca se omite ni se infiere.
export type PlantaVisible = Planta['props'] & { conservacion: EstadoConservacionVisible };

export interface ObtenerPlantaPort { ejecutar(id:string): Promise<PlantaVisible>; }
