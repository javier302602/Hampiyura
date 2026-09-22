import { ValidationError } from '../errors/domain.errors';

// RF-14: una valoración por (autorId, publicacionId) -- volver a calificar actualiza esta
// misma fila, nunca crea una segunda (ver CalificarPublicacionUseCase).
export interface ValoracionProps { id: string; publicacionId: string; autorId: string; estrellas: number; }
export class Valoracion {
  constructor(public readonly props: ValoracionProps) {
    if (!Number.isInteger(props.estrellas) || props.estrellas < 1 || props.estrellas > 5) throw new ValidationError('La calificación debe ser un número entero entre 1 y 5');
  }
}
