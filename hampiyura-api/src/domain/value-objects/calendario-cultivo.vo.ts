import { ValidationError } from '../errors/domain.errors';

function normalizar(meses: number[]): number[] {
  if (!meses.every((m) => Number.isInteger(m) && m >= 1 && m <= 12)) throw new ValidationError('Los meses del calendario deben ser números entre 1 (enero) y 12 (diciembre)');
  return [...new Set(meses)].sort((a, b) => a - b);
}

// RF-254: vista consolidada de épocas del año recomendadas para siembra/cosecha de una planta.
export class CalendarioCultivo {
  readonly mesesSiembra: number[];
  readonly mesesCosecha: number[];
  constructor(mesesSiembra: number[], mesesCosecha: number[]) {
    this.mesesSiembra = normalizar(mesesSiembra);
    this.mesesCosecha = normalizar(mesesCosecha);
  }
}
