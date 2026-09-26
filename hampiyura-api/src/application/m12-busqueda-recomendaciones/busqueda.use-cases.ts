import { BuscarPlantasPort, FiltrosBusquedaPlantas, ResultadoBusquedaPlanta } from '../../domain/ports/in/m12-busqueda-recomendaciones/buscar-plantas.port';
import { PlantaRepositoryPort } from '../../domain/ports/out/planta.repository.port';
import { PublicacionRepositoryPort } from '../../domain/ports/out/publicacion.repository.port';
import { ParteUsoRepositoryPort } from '../../domain/ports/out/parte-uso.repository.port';
import { UsoRepositoryPort } from '../../domain/ports/out/uso.repository.port';
import { Planta } from '../../domain/entities/planta.entity';
import { BusquedasRepositoryPort } from '../../domain/ports/out/mensajeria-alertas.ports';
import { Publicacion } from '../../domain/entities/publicacion.entity';

const LARGO_DESCRIPCION_BREVE = 160;

function normalizar(texto: string): string { return texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
function contiene(campo: string, termino: string): boolean { return normalizar(campo).includes(normalizar(termino)); }

function descripcionBreve(publicacionesDeLaPlanta: Publicacion[]): string | null {
  const validadas = publicacionesDeLaPlanta.filter((p) => p.esVisiblePublicamente()).sort((a, b) => b.props.fechaPublicacion.getTime() - a.props.fechaPublicacion.getTime());
  const texto = validadas[0]?.props.descripcion;
  if (!texto) return null;
  return texto.length > LARGO_DESCRIPCION_BREVE ? `${texto.slice(0, LARGO_DESCRIPCION_BREVE - 1)}…` : texto;
}

// RF-17/18/42/110/148/153/19 en un único caso de uso combinable (ver decisión de diseño en el
// resumen de la fase): todo filtro provisto debe cumplirse (AND) para que una planta aparezca.
export class BuscarPlantasUseCase implements BuscarPlantasPort {
  constructor(
    private readonly plantas: PlantaRepositoryPort,
    private readonly publicaciones: PublicacionRepositoryPort,
    private readonly partesUso: ParteUsoRepositoryPort,
    private readonly usos: UsoRepositoryPort,
    // Ronda 30: registro ANÓNIMO (solo planta y fecha) de las plantas devueltas por una búsqueda por nombre; alimenta el reporte institucional.
    private readonly busquedas?: BusquedasRepositoryPort,
  ) {}

  async ejecutar(filtros: FiltrosBusquedaPlantas): Promise<ResultadoBusquedaPlanta[]> {
    let candidatas: Planta[] = await this.plantas.listar();

    if (filtros.q?.trim()) {
      const termino = filtros.q.trim();
      candidatas = candidatas.filter((p) => contiene(p.props.nombreComun, termino));
    }

    const todasLasPublicaciones = await this.publicaciones.listar();

    if (filtros.enfermedad?.trim()) {
      const termino = filtros.enfermedad.trim();
      const plantaIdsConEnfermedad = new Set(
        todasLasPublicaciones.filter((p) => p.esVisiblePublicamente() && contiene(p.props.enfermedadesTratadas, termino)).map((p) => p.props.plantaId),
      );
      candidatas = candidatas.filter((p) => plantaIdsConEnfermedad.has(p.props.id));
    }

    const terminoCategoria = filtros.categoria?.trim() || filtros.propiedad?.trim();
    if (terminoCategoria) {
      const todosLosUsos = await this.usos.listar();
      const usoCoincidente = todosLosUsos.find((u) => normalizar(u.props.nombre) === normalizar(terminoCategoria));
      if (!usoCoincidente) {
        candidatas = [];
      } else {
        const partesUsoDelUso = await this.partesUso.listarPorUso(usoCoincidente.props.id);
        const plantaIdsConCategoria = new Set(partesUsoDelUso.filter((pu) => pu.props.estadoValidacion === 'Validado').map((pu) => pu.props.plantaId));
        candidatas = candidatas.filter((p) => plantaIdsConCategoria.has(p.props.id));
      }
    }

    if (filtros.q?.trim() && this.busquedas) await this.busquedas.registrar(candidatas.map((p) => p.props.id), new Date()).catch(() => undefined);

    return candidatas.map((p) => ({
      id: p.props.id,
      nombreComun: p.props.nombreComun,
      nombreCientifico: p.props.nombreCientifico,
      imagenPrincipal: p.props.imagenPrincipal,
      descripcionBreve: descripcionBreve(todasLasPublicaciones.filter((pub) => pub.props.plantaId === p.props.id)),
    }));
  }
}
