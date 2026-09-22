import { randomUUID } from 'crypto';
import { Planta } from '../../domain/entities/planta.entity';
import { RegistrarPlantaInput, RegistrarPlantaPort } from '../../domain/ports/in/m02-catalogo-plantas/registrar-planta.port';
import { ListarPlantasPort } from '../../domain/ports/in/m02-catalogo-plantas/listar-plantas.port';
import { ObtenerPlantaPort, PlantaVisible } from '../../domain/ports/in/m02-catalogo-plantas/obtener-planta.port';
import { PlantaRepositoryPort } from '../../domain/ports/out/planta.repository.port';
import { EstadoConservacionRepositoryPort } from '../../domain/ports/out/estado-conservacion.repository.port';
import { aVistaConservacion } from '../m10-conservacion/conservacion.use-cases';
import { NotFoundError, ValidationError } from '../../domain/errors/domain.errors';

export class RegistrarPlantaUseCase implements RegistrarPlantaPort {
  constructor(private readonly repo:PlantaRepositoryPort) {}
  async ejecutar(input:RegistrarPlantaInput):Promise<Planta> {
    if (!input.nombreComun?.trim()) throw new ValidationError('El nombre común es obligatorio');
    if (!input.nombreCientifico?.trim()) throw new ValidationError('El nombre científico es obligatorio');
    const planta = new Planta({ ...input, id:randomUUID() });
    await this.repo.guardar(planta);
    return planta;
  }
}
export class ListarPlantasUseCase implements ListarPlantasPort {
  constructor(private readonly repo:PlantaRepositoryPort) {}
  async ejecutar():Promise<Planta[]> { return this.repo.listar(); }
}
export class ObtenerPlantaUseCase implements ObtenerPlantaPort {
  constructor(private readonly repo:PlantaRepositoryPort, private readonly estadosConservacion:EstadoConservacionRepositoryPort) {}
  async ejecutar(id:string):Promise<PlantaVisible> {
    const planta = await this.repo.buscarPorId(id);
    if (!planta) throw new NotFoundError(`Planta no encontrada: ${id}`);
    const conservacion = aVistaConservacion(await this.estadosConservacion.buscarValidadoPorPlanta(id));
    return { ...planta.props, conservacion };
  }
}
