import { randomUUID } from 'crypto';
import { EstadoConservacion, TEXTO_CONSERVACION_NO_DETERMINADO } from '../../domain/entities/estado-conservacion.entity';
import { AccionConservacion } from '../../domain/entities/accion-conservacion.entity';
import { ValidacionContenido } from '../../domain/entities/validacion-contenido.entity';
import { RegistrarEstadoConservacionInput, RegistrarEstadoConservacionPort } from '../../domain/ports/in/m10-conservacion/registrar-estado-conservacion.port';
import { ObtenerEstadoConservacionPort, EstadoConservacionVisible } from '../../domain/ports/in/m10-conservacion/obtener-estado-conservacion.port';
import { RegistrarAccionConservacionInput, RegistrarAccionConservacionPort } from '../../domain/ports/in/m10-conservacion/registrar-accion-conservacion.port';
import { ListarAccionesConservacionPort } from '../../domain/ports/in/m10-conservacion/listar-acciones-conservacion.port';
import { EstadoConservacionRepositoryPort } from '../../domain/ports/out/estado-conservacion.repository.port';
import { AccionConservacionRepositoryPort } from '../../domain/ports/out/accion-conservacion.repository.port';
import { PlantaRepositoryPort } from '../../domain/ports/out/planta.repository.port';
import { ValidacionContenidoRepositoryPort } from '../../domain/ports/out/validacion-contenido.repository.port';
import { esNivelRiesgoConservacion } from '../../domain/value-objects/nivel-riesgo-conservacion.vo';
import { esEstadoSeguimientoAccion } from '../../domain/value-objects/estado-seguimiento-accion.vo';
import { ValidationError } from '../../domain/errors/domain.errors';

// Reusado por M-02 (ObtenerPlantaUseCase) para enriquecer la ficha de planta sin duplicar endpoint.
export function aVistaConservacion(estado: EstadoConservacion | null): EstadoConservacionVisible {
  if (!estado || !estado.esVisiblePublicamente()) return { disponible: false, mensaje: TEXTO_CONSERVACION_NO_DETERMINADO, alertaVisible: false };
  return { disponible: true, alertaVisible: estado.estaEnRiesgo(), ...estado.props };
}

// RF-267: exige fuente oficial (Fuente ya lo garantiza por constructor) y planta existente.
// Nunca se muestra como publicado sin pasar por M-09 -- mismo mecanismo que Cultivo/ParteUso.
export class RegistrarEstadoConservacionUseCase implements RegistrarEstadoConservacionPort {
  constructor(private readonly repo:EstadoConservacionRepositoryPort, private readonly plantas:PlantaRepositoryPort, private readonly validaciones:ValidacionContenidoRepositoryPort) {}
  async ejecutar(input:RegistrarEstadoConservacionInput):Promise<EstadoConservacion> {
    if (!(await this.plantas.buscarPorId(input.plantaId))) throw new ValidationError(`La planta indicada no existe en el catálogo: ${input.plantaId}`);
    if (!esNivelRiesgoConservacion(input.nivelRiesgo)) throw new ValidationError(`Nivel de riesgo no reconocido: ${input.nivelRiesgo}`);
    if (!input.categoria?.trim()) throw new ValidationError('La categoría de conservación es obligatoria');
    if (!input.zona?.trim()) throw new ValidationError('La zona es obligatoria');
    if (!input.amenazas?.trim()) throw new ValidationError('Las amenazas son obligatorias');
    const estado = new EstadoConservacion({ ...input, id:randomUUID(), fecha:new Date(), estadoValidacion:'Pendiente' });
    await this.repo.guardar(estado);
    await this.validaciones.guardar(new ValidacionContenido({ id:randomUUID(), tipoEntidad:'EstadoConservacion', entidadId:estado.props.id, estado:'Pendiente', fecha:new Date(), autorId:estado.props.autorId }));
    return estado;
  }
}
export class ObtenerEstadoConservacionUseCase implements ObtenerEstadoConservacionPort {
  constructor(private readonly repo:EstadoConservacionRepositoryPort) {}
  async ejecutar(plantaId:string):Promise<EstadoConservacionVisible> { return aVistaConservacion(await this.repo.buscarValidadoPorPlanta(plantaId)); }
}

// RF-268: no exige Fuente ni pasa por M-09 -- es un registro de actividad, no una afirmación científica.
export class RegistrarAccionConservacionUseCase implements RegistrarAccionConservacionPort {
  constructor(private readonly repo:AccionConservacionRepositoryPort, private readonly plantas:PlantaRepositoryPort) {}
  async ejecutar(input:RegistrarAccionConservacionInput):Promise<AccionConservacion> {
    if (!(await this.plantas.buscarPorId(input.plantaId))) throw new ValidationError(`La planta indicada no existe en el catálogo: ${input.plantaId}`);
    if (!esEstadoSeguimientoAccion(input.estadoSeguimiento)) throw new ValidationError(`Estado de seguimiento no reconocido: ${input.estadoSeguimiento}`);
    if (!input.descripcion?.trim()) throw new ValidationError('La descripción de la acción es obligatoria');
    if (!input.responsable?.trim()) throw new ValidationError('El responsable es obligatorio');
    const accion = new AccionConservacion({ ...input, id:randomUUID(), fecha:new Date() });
    await this.repo.guardar(accion);
    return accion;
  }
}
export class ListarAccionesConservacionUseCase implements ListarAccionesConservacionPort {
  constructor(private readonly repo:AccionConservacionRepositoryPort) {}
  async ejecutar(plantaId:string):Promise<AccionConservacion[]> { return this.repo.listarPorPlanta(plantaId); }
}
