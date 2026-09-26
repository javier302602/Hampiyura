import { ObtenerFichaCultivoPort, FichaCultivoVisible } from '../../domain/ports/in/m03-cultivo/obtener-ficha-cultivo.port';
import { CultivoRepositoryPort } from '../../domain/ports/out/cultivo.repository.port';
import { CAMPOS_GUIA } from '../../domain/value-objects/guia-cultivo.vo';
import { Cultivo } from '../../domain/entities/cultivo.entity';
import { NotFoundError } from '../../domain/errors/domain.errors';

export function aVistaFichaCultivo(cultivo: Cultivo): FichaCultivoVisible {
  const { guia: datos, guiaEspecialistaId: _e, guiaActualizadaEn, ...resto } = cultivo.props;
  const campos: Record<string, string | null> = {};
  for (const c of CAMPOS_GUIA) campos[c.clave] = datos?.[c.clave] ?? null;
  const guia = { campos, completada: Object.values(campos).filter(Boolean).length, total: CAMPOS_GUIA.length, actualizadaEn: guiaActualizadaEn ?? null };
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
