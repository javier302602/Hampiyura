import { ListarFichasCultivoPort } from '../../domain/ports/in/m03-cultivo/listar-fichas-cultivo.port';
import { FichaCultivoVisible } from '../../domain/ports/in/m03-cultivo/obtener-ficha-cultivo.port';
import { CultivoRepositoryPort } from '../../domain/ports/out/cultivo.repository.port';
import { aVistaFichaCultivo } from './obtener-ficha-cultivo.use-case';

export class ListarFichasCultivoUseCase implements ListarFichasCultivoPort {
  constructor(private readonly repo:CultivoRepositoryPort) {}
  async ejecutar(plantaId:string):Promise<FichaCultivoVisible[]> {
    const cultivos = await this.repo.listarPorPlanta(plantaId);
    return cultivos.map(aVistaFichaCultivo);
  }
}
