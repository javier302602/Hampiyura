import { ValidationError } from '../errors/domain.errors';

export class Fuente {
  readonly valor: string;
  constructor(valor: string) {
    const normalizada = valor.trim();
    if (!normalizada) throw new ValidationError('La fuente citable es obligatoria');
    this.valor = normalizada;
  }
}
