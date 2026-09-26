import { ObtenerFichaCultivoPort, FichaCultivoVisible } from '../../domain/ports/in/m03-cultivo/obtener-ficha-cultivo.port';
import { CultivoRepositoryPort } from '../../domain/ports/out/cultivo.repository.port';
import { Cultivo } from '../../domain/entities/cultivo.entity';
import { NotFoundError } from '../../domain/errors/domain.errors';

export function aVistaFichaCultivo(cultivo: Cultivo): FichaCultivoVisible {
  const { guiaSuelo, guiaNutrientes, guiaHerramientas, guiaEspecialistaId: _e, guiaActualizadaEn, ...resto } = cultivo.props;
  const guia = { suelo: guiaSuelo ?? null, nutrientes: guiaNutrientes ?? null, herramientas: guiaHerramientas ?? null, actualizadaEn: guiaActualizadaEn ?? null };
  if (!cultivo.puedeMostrarseComoValidado()) return { disponible:false, id:cultivo.props.id, plantaId:cultivo.props.plantaId, estadoValidacion:cultivo.props.estadoValidacion, mensaje:'Información de cultivo pendiente de validación', guia };
  return { disponible:true, ...resto, guia };
}

export class ObtenerFichaCultivoUseCase implements ObtenerFichaCultivoPort {
  constructor(private readonly repo:CultivoRepositoryPort) {}
  async ejecutar(id:string):Promise<FichaCultivoVisible> {
    const cultivo = await this.repo.buscarPorId(id);
    if (!cultivo) throw new NotFoundError(`Ficha de cultivo no encontrada: ${id}`);
    return aVistaFichaCultivo(cultivo);
  }
}
