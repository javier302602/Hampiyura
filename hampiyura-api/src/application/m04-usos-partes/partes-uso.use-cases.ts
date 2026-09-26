import { randomUUID } from 'crypto';
import { ParteUso } from '../../domain/entities/parte-uso.entity';
import { ValidacionContenido } from '../../domain/entities/validacion-contenido.entity';
import { RegistrarParteUsoInput, RegistrarParteUsoPort } from '../../domain/ports/in/m04-usos-partes/registrar-parte-uso.port';
import { ObtenerParteUsoPort, ParteUsoVisible } from '../../domain/ports/in/m04-usos-partes/obtener-parte-uso.port';
import { ListarPartesUsoPort } from '../../domain/ports/in/m04-usos-partes/listar-partes-uso.port';
import { ParteUsoRepositoryPort } from '../../domain/ports/out/parte-uso.repository.port';
import { UsoRepositoryPort } from '../../domain/ports/out/uso.repository.port';
import { ValidacionContenidoRepositoryPort } from '../../domain/ports/out/validacion-contenido.repository.port';
import { esTipoParte } from '../../domain/value-objects/tipo-parte.vo';
import { esTipoConocimiento } from '../../domain/value-objects/tipo-conocimiento.vo';
import { NotFoundError, ValidationError } from '../../domain/errors/domain.errors';

export function aVistaParteUso(parteUso: ParteUso): ParteUsoVisible {
  const { contactoSeguimiento: _contacto, validacionCientifica: _evidencia, ...publico } = parteUso.props;
  return { ...publico, verificado: parteUso.puedeMostrarseComoVerificado(), advertencia: parteUso.etiquetaAdvertencia() };
}

export class RegistrarParteUsoUseCase implements RegistrarParteUsoPort {
  constructor(private readonly repo:ParteUsoRepositoryPort, private readonly usos:UsoRepositoryPort, private readonly validaciones:ValidacionContenidoRepositoryPort) {}
  async ejecutar(input:RegistrarParteUsoInput):Promise<ParteUso> {
    if (!esTipoParte(input.parte)) throw new ValidationError(`Parte de la planta no reconocida: ${input.parte}`);
    if (!esTipoConocimiento(input.tipoConocimiento)) throw new ValidationError(`Tipo de conocimiento no reconocido: ${input.tipoConocimiento}`);
    if (!(await this.usos.buscarPorId(input.usoId))) throw new ValidationError(`El uso/finalidad indicado no existe en el catálogo: ${input.usoId}`);
    const parteUso = new ParteUso({ ...input, id:randomUUID(), estadoValidacion:'Pendiente' });
    await this.repo.guardar(parteUso);
    await this.validaciones.guardar(new ValidacionContenido({ id:randomUUID(), tipoEntidad:'ParteUso', entidadId:parteUso.props.id, estado:'Pendiente', fecha:new Date(), autorId:parteUso.props.autorId }));
    return parteUso;
  }
}
export class ObtenerParteUsoUseCase implements ObtenerParteUsoPort {
  constructor(private readonly repo:ParteUsoRepositoryPort) {}
  async ejecutar(id:string):Promise<ParteUsoVisible> {
    const parteUso = await this.repo.buscarPorId(id);
    if (!parteUso) throw new NotFoundError(`Parte+Uso no encontrado: ${id}`);
    return aVistaParteUso(parteUso);
  }
}
export class ListarPartesUsoUseCase implements ListarPartesUsoPort {
  constructor(private readonly repo:ParteUsoRepositoryPort) {}
  async ejecutar(plantaId:string):Promise<ParteUsoVisible[]> {
    const items = await this.repo.listarPorPlanta(plantaId);
    return items.map(aVistaParteUso);
  }
}
