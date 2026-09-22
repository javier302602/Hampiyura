import { randomUUID } from 'crypto';
import { Planta } from '../../domain/entities/planta.entity';
import { ValidacionContenido } from '../../domain/entities/validacion-contenido.entity';
import { RegistrarPlantaInput, RegistrarPlantaPort } from '../../domain/ports/in/m02-catalogo-plantas/registrar-planta.port';
import { ListarPlantasPort } from '../../domain/ports/in/m02-catalogo-plantas/listar-plantas.port';
import { ObtenerPlantaPort, PlantaVisible } from '../../domain/ports/in/m02-catalogo-plantas/obtener-planta.port';
import { PlantaRepositoryPort } from '../../domain/ports/out/planta.repository.port';
import { EstadoConservacionRepositoryPort } from '../../domain/ports/out/estado-conservacion.repository.port';
import { ValidacionContenidoRepositoryPort } from '../../domain/ports/out/validacion-contenido.repository.port';
import { aVistaConservacion } from '../m10-conservacion/conservacion.use-cases';
import { NotFoundError, ValidationError } from '../../domain/errors/domain.errors';

function validarCampos(input: RegistrarPlantaInput) {
  if (!input.nombreComun?.trim()) throw new ValidationError('El nombre común es obligatorio');
  if (!input.nombreCientifico?.trim()) throw new ValidationError('El nombre científico es obligatorio');
}

// Alta directa (solo validador/admin, POST /plantas) -- queda Validado de inmediato, visible en el
// catálogo público al toque. Sin cambios de comportamiento respecto a antes de Frente 4.
export class RegistrarPlantaUseCase implements RegistrarPlantaPort {
  constructor(private readonly repo:PlantaRepositoryPort) {}
  async ejecutar(input:RegistrarPlantaInput):Promise<Planta> {
    validarCampos(input);
    const planta = new Planta({ ...input, id:randomUUID(), estadoValidacion:'Validado' });
    await this.repo.guardar(planta);
    return planta;
  }
}

// Frente 4 (auditoría): "Proponer planta" no existía en ningún rol. Mismo patrón que
// CrearPublicacionUseCase/PublicarProductoUseCase -- cualquier usuario autenticado, queda
// Pendiente, entra a la bandeja de M-09 (Planta se agregó a entidadesValidables en el container).
export interface ProponerPlantaInput extends RegistrarPlantaInput { proponenteId: string; }
export class ProponerPlantaUseCase {
  constructor(private readonly repo:PlantaRepositoryPort, private readonly validaciones:ValidacionContenidoRepositoryPort) {}
  async ejecutar(input:ProponerPlantaInput):Promise<Planta> {
    validarCampos(input);
    const { proponenteId, ...datos } = input;
    const planta = new Planta({ ...datos, id:randomUUID(), estadoValidacion:'Pendiente' });
    await this.repo.guardar(planta);
    await this.validaciones.guardar(new ValidacionContenido({ id:randomUUID(), tipoEntidad:'Planta', entidadId:planta.props.id, estado:'Pendiente', fecha:new Date(), autorId:proponenteId }));
    return planta;
  }
}

// Catálogo público: solo plantas Validado (mismo criterio que Producto/Publicacion). Las plantas
// que ya existían antes de Frente 4 quedaron todas en Validado por el default de la migración, así
// que esto no les cambia la visibilidad a ninguna -- solo oculta las propuestas nuevas mientras
// están Pendiente/Observado/Rechazado.
export class ListarPlantasUseCase implements ListarPlantasPort {
  constructor(private readonly repo:PlantaRepositoryPort) {}
  async ejecutar():Promise<Planta[]> { return (await this.repo.listar()).filter((p) => p.esVisiblePublicamente()); }
}
export class ObtenerPlantaUseCase implements ObtenerPlantaPort {
  constructor(private readonly repo:PlantaRepositoryPort, private readonly estadosConservacion:EstadoConservacionRepositoryPort) {}
  async ejecutar(id:string):Promise<PlantaVisible> {
    const planta = await this.repo.buscarPorId(id);
    if (!planta || !planta.esVisiblePublicamente()) throw new NotFoundError(`Planta no encontrada: ${id}`);
    const conservacion = aVistaConservacion(await this.estadosConservacion.buscarValidadoPorPlanta(id));
    return { ...planta.props, conservacion };
  }
}
