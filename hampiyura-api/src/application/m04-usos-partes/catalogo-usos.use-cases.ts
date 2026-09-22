import { randomUUID } from 'crypto';
import { Uso } from '../../domain/entities/uso.entity';
import { RegistrarUsoInput, RegistrarUsoPort } from '../../domain/ports/in/m04-usos-partes/registrar-uso.port';
import { ListarUsosPort } from '../../domain/ports/in/m04-usos-partes/listar-usos.port';
import { UsoRepositoryPort } from '../../domain/ports/out/uso.repository.port';
import { ValidationError } from '../../domain/errors/domain.errors';

// RF-256: catálogo semiabierto -- cualquier especialista/administrador puede ampliarlo
// (vía requireValidator en la ruta), pero cada nombre es único para evitar duplicados
// que rompan la estandarización de búsquedas.
export class RegistrarUsoUseCase implements RegistrarUsoPort {
  constructor(private readonly repo:UsoRepositoryPort) {}
  async ejecutar(input:RegistrarUsoInput):Promise<Uso> {
    if (!input.nombre?.trim()) throw new ValidationError('El nombre del uso/finalidad es obligatorio');
    if (await this.repo.buscarPorNombre(input.nombre)) throw new ValidationError(`El uso "${input.nombre}" ya existe en el catálogo`);
    const uso = new Uso({ ...input, id:randomUUID() });
    await this.repo.guardar(uso);
    return uso;
  }
}
export class ListarUsosUseCase implements ListarUsosPort {
  constructor(private readonly repo:UsoRepositoryPort) {}
  async ejecutar():Promise<Uso[]> { return this.repo.listar(); }
}
