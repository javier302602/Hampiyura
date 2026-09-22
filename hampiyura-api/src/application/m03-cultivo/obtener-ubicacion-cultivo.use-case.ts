import { UbicacionCultivo } from '../../domain/entities/ubicacion-cultivo.entity';
import { ObtenerUbicacionCultivoPort } from '../../domain/ports/in/m03-cultivo/obtener-ubicacion-cultivo.port';
import { MapaCultivoPort } from '../../domain/ports/out/mapa-cultivo.port';

export class ObtenerUbicacionCultivoUseCase implements ObtenerUbicacionCultivoPort {
  constructor(private readonly repo: MapaCultivoPort) {}
  async ejecutar(cultivoId: string): Promise<UbicacionCultivo | null> { return this.repo.obtenerUbicacion(cultivoId); }
}
