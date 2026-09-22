import { ValidationError } from '../errors/domain.errors';

export class ContraseñaSegura {
  readonly valor: string;
  constructor(valor: string) {
    if (valor.length < 8 || !/[a-zA-Z]/.test(valor) || !/[0-9]/.test(valor)) throw new ValidationError('La contraseña debe tener mínimo 8 caracteres, incluyendo letras y números');
    this.valor = valor;
  }
}
