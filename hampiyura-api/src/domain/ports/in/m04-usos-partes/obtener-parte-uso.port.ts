import { ParteUso } from '../../../entities/parte-uso.entity';

// RF-257: el tipo de conocimiento y el estado de validación viajan siempre visibles.
// RF-255: `verificado`/`advertencia` son la señal explícita para que la API/el frontend
// nunca presenten un Parte+Uso tradicional o pendiente como un hecho médico verificado.
export type ParteUsoVisible = ParteUso['props'] & { verificado: boolean; advertencia: string | null };

export interface ObtenerParteUsoPort { ejecutar(id: string): Promise<ParteUsoVisible>; }
