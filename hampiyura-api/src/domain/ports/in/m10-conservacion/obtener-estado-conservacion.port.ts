import { EstadoConservacion } from '../../../entities/estado-conservacion.entity';

// Mismo patrón de "ficha visible/no visible" que ya usa M-03 (FichaCultivoVisible). Cuando no hay
// ningún registro validado, se muestra el texto literal de RF-267, nunca se omite el campo ni se
// infiere un valor. `alertaVisible` es lo que M-02 reusa para enriquecer la ficha de planta (RF-269).
export type EstadoConservacionVisible =
  | ({ disponible: true; alertaVisible: boolean } & EstadoConservacion['props'])
  | { disponible: false; mensaje: string; alertaVisible: false };

export interface ObtenerEstadoConservacionPort { ejecutar(plantaId: string): Promise<EstadoConservacionVisible>; }
