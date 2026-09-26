import { randomUUID } from 'crypto';
import { Planta, propsPublicasDePlanta } from '../../domain/entities/planta.entity';
import { RegistrarParteUsoPort, RegistrarParteUsoInput } from '../../domain/ports/in/m04-usos-partes/registrar-parte-uso.port';
import { UsoRepositoryPort } from '../../domain/ports/out/uso.repository.port';
import { esTipoParte } from '../../domain/value-objects/tipo-parte.vo';
import { esTipoConocimiento } from '../../domain/value-objects/tipo-conocimiento.vo';
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
  const { latitud, longitud } = input;
  if ((latitud == null) !== (longitud == null)) throw new ValidationError('La ubicación necesita latitud y longitud juntas');
  if (latitud != null && (latitud < -90 || latitud > 90)) throw new ValidationError('Latitud fuera de rango (-90 a 90)');
  if (longitud != null && (longitud < -180 || longitud > 180)) throw new ValidationError('Longitud fuera de rango (-180 a 180)');
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
// `parteUso` (RF-255): parte medicinal + uso que propone la misma persona. Se registra con el flujo normal
// de M-04 (queda 'Pendiente' y entra a la bandeja de M-09) -- nunca como uso verificado (RF-257).
export type ParteUsoPropuesto = Pick<RegistrarParteUsoInput, 'parte' | 'usoId' | 'tipoConocimiento' | 'fuente' | 'motivoUso' | 'parteDetalle' | 'contraindicaciones'>;
// Máximo de bloques de parte+uso por propuesta: hay 8 tipos de parte (hoja, fruto, raíz, corteza, tallo, flor, semilla, otra).
export const MAX_PARTES_POR_PROPUESTA = 8;
export interface ProponerPlantaInput extends RegistrarPlantaInput { proponenteId: string; partesUso?: ParteUsoPropuesto[]; }
export class ProponerPlantaUseCase {
  constructor(private readonly repo:PlantaRepositoryPort, private readonly validaciones:ValidacionContenidoRepositoryPort, private readonly registrarParteUso?:RegistrarParteUsoPort, private readonly usos?:UsoRepositoryPort) {}
  async ejecutar(input:ProponerPlantaInput):Promise<Planta> {
    validarCampos(input);
    const { proponenteId, partesUso = [], ...datos } = input;
    if (partesUso.length > MAX_PARTES_POR_PROPUESTA) throw new ValidationError(`Una propuesta admite hasta ${MAX_PARTES_POR_PROPUESTA} partes medicinales`);
    const combinaciones = new Set<string>();
    // Se valida TODO antes de guardar nada, para no dejar una planta huérfana si alguna parte/uso es inválida.
    for (const parteUso of partesUso) {
      const clave = `${parteUso.parte}|${parteUso.parte === 'Otra' ? parteUso.parteDetalle?.trim().toLowerCase() : ''}|${parteUso.usoId}`;
      if (combinaciones.has(clave)) throw new ValidationError('Hay dos bloques con la misma parte y el mismo uso: agrégalos una sola vez');
      combinaciones.add(clave);
      if (!esTipoParte(parteUso.parte)) throw new ValidationError(`Parte de la planta no reconocida: ${parteUso.parte}`);
      if (!esTipoConocimiento(parteUso.tipoConocimiento)) throw new ValidationError('Tipo de conocimiento no reconocido');
      if (this.usos && !(await this.usos.buscarPorId(parteUso.usoId))) throw new ValidationError('El uso indicado no existe en el catálogo');
      if (!parteUso.motivoUso?.trim()) throw new ValidationError('Indica para qué se usa la parte medicinal y por qué');
      if (parteUso.parte === 'Otra' && !parteUso.parteDetalle?.trim()) throw new ValidationError('Indica cuál es la parte de la planta');
    }
    const planta = new Planta({ ...datos, id:randomUUID(), estadoValidacion:'Pendiente' });
    await this.repo.guardar(planta);
    await this.validaciones.guardar(new ValidacionContenido({ id:randomUUID(), tipoEntidad:'Planta', entidadId:planta.props.id, estado:'Pendiente', fecha:new Date(), autorId:proponenteId }));
    // Cada bloque es su propio registro Planta→Parte→Uso y entra a moderación (M-09) por separado.
    if (this.registrarParteUso) for (const parteUso of partesUso) await this.registrarParteUso.ejecutar({ ...parteUso, plantaId:planta.props.id, autorId:proponenteId });
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
    return { ...propsPublicasDePlanta(planta.props), conservacion };
  }
}
