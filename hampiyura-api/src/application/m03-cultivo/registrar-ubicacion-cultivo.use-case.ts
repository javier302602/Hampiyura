import { randomUUID } from 'crypto';
import { UbicacionCultivo } from '../../domain/entities/ubicacion-cultivo.entity';
import { RegistrarUbicacionCultivoInput, RegistrarUbicacionCultivoPort } from '../../domain/ports/in/m03-cultivo/registrar-ubicacion-cultivo.port';
import { MapaCultivoPort } from '../../domain/ports/out/mapa-cultivo.port';
import { CultivoRepositoryPort } from '../../domain/ports/out/cultivo.repository.port';
import { EstadoConservacionRepositoryPort } from '../../domain/ports/out/estado-conservacion.repository.port';
import { ValidationError } from '../../domain/errors/domain.errors';

// RF-271 + RN-07: nunca se GUARDAN coordenadas exactas de una especie actualmente en riesgo
// (Vulnerable/EnPeligro/EnPeligroCritico validado), sin importar lo que haya enviado el cliente --
// se degrada silenciosamente a solo zona amplia, igual que EstadoConservacion.zona nunca es exacta.
export class RegistrarUbicacionCultivoUseCase implements RegistrarUbicacionCultivoPort {
  constructor(
    private readonly repo: MapaCultivoPort,
    private readonly cultivos: CultivoRepositoryPort,
    private readonly estadosConservacion: EstadoConservacionRepositoryPort,
  ) {}
  async ejecutar(input: RegistrarUbicacionCultivoInput): Promise<UbicacionCultivo> {
    const cultivo = await this.cultivos.buscarPorId(input.cultivoId);
    if (!cultivo) throw new ValidationError(`El cultivo indicado no existe: ${input.cultivoId}`);
    if (!input.zona?.trim()) throw new ValidationError('La zona de la ubicación es obligatoria');
    if (input.latitud !== undefined && (input.latitud < -90 || input.latitud > 90)) throw new ValidationError('Latitud fuera de rango (-90 a 90)');
    if (input.longitud !== undefined && (input.longitud < -180 || input.longitud > 180)) throw new ValidationError('Longitud fuera de rango (-180 a 180)');

    const estado = await this.estadosConservacion.buscarValidadoPorPlanta(cultivo.props.plantaId);
    const enRiesgo = estado?.estaEnRiesgo() ?? false;

    const ubicacion = new UbicacionCultivo({
      id: randomUUID(),
      cultivoId: input.cultivoId,
      plantaId: cultivo.props.plantaId,
      autorId: input.autorId,
      zona: input.zona,
      latitud: enRiesgo ? null : input.latitud ?? null,
      longitud: enRiesgo ? null : input.longitud ?? null,
      fecha: new Date(),
    });
    await this.repo.guardar(ubicacion);
    return ubicacion;
  }
}
