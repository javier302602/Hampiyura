import { ListarMapaCultivoPort, OpcionesMapaCultivo, UbicacionCultivoVisible } from '../../domain/ports/in/m03-cultivo/listar-mapa-cultivo.port';
import { MapaCultivoPort } from '../../domain/ports/out/mapa-cultivo.port';
import { PlantaRepositoryPort } from '../../domain/ports/out/planta.repository.port';
import { CultivoRepositoryPort } from '../../domain/ports/out/cultivo.repository.port';
import { EstadoConservacionRepositoryPort } from '../../domain/ports/out/estado-conservacion.repository.port';
import { UsuarioRepositoryPort } from '../../domain/ports/out/usuario.repository.port';
import { estaEnRiesgo } from '../../domain/value-objects/evaluacion-conservacion.vo';

// RF-271: vista pública agregada para el mapa de distribución. Enriquece cada ubicación con el
// nombre de la planta y el método de propagación de su ficha de cultivo (aproximación mínima a
// "tipo de cultivo" para el popup -- Cultivo no tiene un campo "tipo" dedicado).
export class ListarMapaCultivoUseCase implements ListarMapaCultivoPort {
  constructor(
    private readonly repo: MapaCultivoPort,
    private readonly plantas: PlantaRepositoryPort,
    private readonly cultivos: CultivoRepositoryPort,
    private readonly estadosConservacion: EstadoConservacionRepositoryPort,
    private readonly usuarios: UsuarioRepositoryPort,
  ) {}
  async ejecutar(opciones: OpcionesMapaCultivo = {}): Promise<UbicacionCultivoVisible[]> {
    const ubicaciones = await this.repo.listarTodas();
    const riesgoPorPlanta = new Map<string, boolean>();
    const plantaPorId = new Map<string, Awaited<ReturnType<PlantaRepositoryPort['buscarPorId']>>>();
    const cultivoPorId = new Map<string, Awaited<ReturnType<CultivoRepositoryPort['buscarPorId']>>>();
    const usuarioPorId = new Map<string, Awaited<ReturnType<UsuarioRepositoryPort['buscarPorId']>>>();

    const resultado: UbicacionCultivoVisible[] = [];
    for (const u of ubicaciones) {
      // RF-251: una ficha sin validar (o cuya ficha ya no existe) no se publica en el mapa público.
      if (!cultivoPorId.has(u.props.cultivoId)) cultivoPorId.set(u.props.cultivoId, await this.cultivos.buscarPorId(u.props.cultivoId));
      const ficha = cultivoPorId.get(u.props.cultivoId);
      if (!ficha || (!opciones.incluirNoValidadas && ficha.props.estadoValidacion !== 'Validado')) continue;
      if (!plantaPorId.has(u.props.plantaId)) plantaPorId.set(u.props.plantaId, await this.plantas.buscarPorId(u.props.plantaId));
      if (!riesgoPorPlanta.has(u.props.plantaId)) {
        const estado = await this.estadosConservacion.buscarValidadoPorPlanta(u.props.plantaId);
        // RN-07: riesgo por el registro comunitario (M-10) O por el estado de conservación de referencia (IUCN / D.S. 043-2006-AG, Ronda 31).
        riesgoPorPlanta.set(u.props.plantaId, (estado?.estaEnRiesgo() ?? false) || estaEnRiesgo(plantaPorId.get(u.props.plantaId)?.props.evaluacionConservacion));
      }
      if (!cultivoPorId.has(u.props.cultivoId)) cultivoPorId.set(u.props.cultivoId, await this.cultivos.buscarPorId(u.props.cultivoId));
      if (!usuarioPorId.has(u.props.autorId)) usuarioPorId.set(u.props.autorId, await this.usuarios.buscarPorId(u.props.autorId));

      const enRiesgo = riesgoPorPlanta.get(u.props.plantaId) ?? false;
      const planta = plantaPorId.get(u.props.plantaId);
      const cultivo = cultivoPorId.get(u.props.cultivoId);
      const autor = usuarioPorId.get(u.props.autorId);
      resultado.push({
        id: u.props.id,
        cultivoId: u.props.cultivoId,
        plantaId: u.props.plantaId,
        nombreComunPlanta: planta?.props.nombreComun ?? 'Planta no disponible',
        familia: planta?.props.familia ?? 'No especificada',
        tipoCultivo: cultivo?.props.metodoPropagacion ?? 'No especificado',
        zona: u.props.zona,
        latitud: enRiesgo ? null : u.props.latitud,
        longitud: enRiesgo ? null : u.props.longitud,
        fecha: u.props.fecha,
        autorNombre: autor?.props.nombre ?? u.props.autorId,
        estadoValidacion: ficha.props.estadoValidacion,
      });
    }
    return resultado;
  }
}
