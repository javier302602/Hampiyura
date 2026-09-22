import { randomUUID } from 'crypto';
import { Preparacion } from '../../domain/entities/preparacion.entity';
import { ValidacionContenido } from '../../domain/entities/validacion-contenido.entity';
import { DocumentarPreparacionInput, DocumentarPreparacionPort } from '../../domain/ports/in/m05-preparaciones/documentar-preparacion.port';
import { ObtenerPreparacionPort, PreparacionVisible } from '../../domain/ports/in/m05-preparaciones/obtener-preparacion.port';
import { ListarPreparacionesPort } from '../../domain/ports/in/m05-preparaciones/listar-preparaciones.port';
import { PreparacionRepositoryPort } from '../../domain/ports/out/preparacion.repository.port';
import { ParteUsoRepositoryPort } from '../../domain/ports/out/parte-uso.repository.port';
import { ValidacionContenidoRepositoryPort } from '../../domain/ports/out/validacion-contenido.repository.port';
import { NotFoundError, ValidationError } from '../../domain/errors/domain.errors';

function aVista(preparacion:Preparacion):PreparacionVisible { return { ...preparacion.props, avisoLegal:preparacion.avisoLegal() }; }

// RF-259: exige que la combinación Parte+Uso (M-04) ya exista -- no se documenta una
// preparación de la nada. Entra "Pendiente" y reusa el flujo de M-09 tal cual.
export class DocumentarPreparacionUseCase implements DocumentarPreparacionPort {
  constructor(private readonly repo:PreparacionRepositoryPort, private readonly partesUso:ParteUsoRepositoryPort, private readonly validaciones:ValidacionContenidoRepositoryPort) {}
  async ejecutar(input:DocumentarPreparacionInput):Promise<Preparacion> {
    if (!input.ingredientes?.trim()) throw new ValidationError('Los ingredientes son obligatorios');
    if (!input.pasos?.trim()) throw new ValidationError('El proceso paso a paso es obligatorio');
    if (!input.herramientas?.trim()) throw new ValidationError('Las herramientas/materiales son obligatorios');
    if (!input.tiempoPreparacion?.trim()) throw new ValidationError('El tiempo de preparación es obligatorio');
    if (!input.formaTradicionalElaboracion?.trim()) throw new ValidationError('La forma tradicional de elaboración es obligatoria');
    if (!input.formaConservacion?.trim()) throw new ValidationError('La forma de conservación es obligatoria');
    if (!input.advertencias?.trim()) throw new ValidationError('Las advertencias son obligatorias');
    if (!(await this.partesUso.buscarPorId(input.parteUsoId))) throw new ValidationError(`La combinación Parte+Uso indicada no existe: ${input.parteUsoId}`);
    const preparacion = new Preparacion({ ...input, id:randomUUID(), fecha:new Date(), estadoValidacion:'Pendiente' });
    await this.repo.guardar(preparacion);
    await this.validaciones.guardar(new ValidacionContenido({ id:randomUUID(), tipoEntidad:'Preparacion', entidadId:preparacion.props.id, estado:'Pendiente', fecha:new Date(), autorId:preparacion.props.autorId }));
    return preparacion;
  }
}
export class ObtenerPreparacionUseCase implements ObtenerPreparacionPort {
  constructor(private readonly repo:PreparacionRepositoryPort) {}
  async ejecutar(id:string):Promise<PreparacionVisible> {
    const preparacion = await this.repo.buscarPorId(id);
    if (!preparacion || !preparacion.esVisiblePublicamente()) throw new NotFoundError(`Preparación no encontrada: ${id}`);
    return aVista(preparacion);
  }
}
export class ListarPreparacionesUseCase implements ListarPreparacionesPort {
  constructor(private readonly repo:PreparacionRepositoryPort) {}
  async ejecutar(parteUsoId:string):Promise<PreparacionVisible[]> {
    const todas = await this.repo.listarPorParteUso(parteUsoId);
    return todas.filter(p=>p.esVisiblePublicamente()).map(aVista);
  }
}
