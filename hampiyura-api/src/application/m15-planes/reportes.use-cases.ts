import { AccesoContactoService, DirectorioProductoresUseCase, Solicitante } from './planes.use-cases';
import { BusquedasRepositoryPort } from '../../domain/ports/out/mensajeria-alertas.ports';
import { UsuarioRepositoryPort } from '../../domain/ports/out/usuario.repository.port';
import { PlantaRepositoryPort } from '../../domain/ports/out/planta.repository.port';
import { CultivoRepositoryPort } from '../../domain/ports/out/cultivo.repository.port';
import { ProductoRepositoryPort } from '../../domain/ports/out/producto.repository.port';
import { tieneReportesAgregados } from '../../domain/value-objects/plan.vo';
import { UnauthorizedError } from '../../domain/errors/domain.errors';

// Ronda 30 · Plan Institucional: reportes y datos AGREGADOS de la bioeconomía regional.
// Privacidad: solo conteos por zona/categoría/planta; nunca nombres, correos, teléfonos, coordenadas ni ningún dato de una persona.
// Donde un grupo por zona tiene menos de UMBRAL_MINIMO productores, el conteo se oculta ("menos de 3") para que nadie pueda deducir de quién se trata.
export const UMBRAL_MINIMO = 3;
export const DIAS_BUSQUEDAS = 90;

export interface FilaConteo { etiqueta: string; cantidad: number | null; oculto: boolean }
export interface ReporteBioeconomia {
  generadoEn: Date; umbralMinimo: number; diasBusquedas: number;
  totales: { productoresActivos: number; productoresContactables: number; plantasEnCatalogo: number; plantasConFichaDeCultivoValidada: number; fichasDeCultivoValidadas: number; productosPublicados: number };
  productoresPorZona: FilaConteo[];
  productosPorCategoria: FilaConteo[];
  productosPorTipoProductor: FilaConteo[];
  plantasMasOfrecidas: FilaConteo[];
  plantasMasBuscadas: FilaConteo[];
  notas: string[];
}
const ordenar = (f: FilaConteo[]) => f.sort((a, b) => (b.cantidad ?? -1) - (a.cantidad ?? -1) || a.etiqueta.localeCompare(b.etiqueta, 'es'));
const contar = (valores: string[]): Map<string, number> => valores.reduce((m, v) => m.set(v, (m.get(v) ?? 0) + 1), new Map<string, number>());
const filas = (m: Map<string, number>, limite?: number): FilaConteo[] => ordenar([...m].map(([etiqueta, cantidad]) => ({ etiqueta, cantidad, oculto: false }))).slice(0, limite);

export class ReporteBioeconomiaUseCase {
  constructor(
    private readonly usuarios: UsuarioRepositoryPort, private readonly plantas: PlantaRepositoryPort, private readonly cultivos: CultivoRepositoryPort,
    private readonly productos: ProductoRepositoryPort, private readonly directorio: DirectorioProductoresUseCase, private readonly busquedas: BusquedasRepositoryPort, private readonly acceso: AccesoContactoService,
  ) {}

  async ejecutar(solicitante: Solicitante | undefined, ahora = new Date()): Promise<ReporteBioeconomia> {
    if (!solicitante) throw new UnauthorizedError('Inicia sesión para ver los reportes');
    if (solicitante.rol !== 'Administrador' && !tieneReportesAgregados((await this.acceso.planActivo(solicitante.id, ahora)).plan)) throw new UnauthorizedError('Los reportes agregados son del plan Institucional');

    const visibles = (await this.plantas.listar()).filter((p) => p.esVisiblePublicamente());
    const nombrePlanta = new Map(visibles.map((p) => [p.props.id, p.props.nombreComun]));
    const productos = (await this.productos.listar()).filter((p) => p.esVisiblePublicamente());
    const contactables = await this.directorio.todos();
    let fichas = 0; const plantasConFicha = new Set<string>();
    for (const p of visibles) {
      const validadas = (await this.cultivos.listarPorPlanta(p.props.id)).filter((c) => c.props.estadoValidacion === 'Validado');
      if (validadas.length) { fichas += validadas.length; plantasConFicha.add(p.props.id); }
    }

    // Productores por zona: cuántos productores DISTINTOS hay en cada zona general; se oculta lo que tenga menos de UMBRAL_MINIMO.
    const porZona = contar(contactables.flatMap((p) => [...new Set([...p.zonas, ...p.zonasProducto])]));
    const productoresPorZona = ordenar([...porZona].map(([etiqueta, cantidad]) => cantidad < UMBRAL_MINIMO ? { etiqueta, cantidad: null, oculto: true } : { etiqueta, cantidad, oculto: false }));

    const busquedas = await this.busquedas.contarPorPlanta(new Date(ahora.getTime() - DIAS_BUSQUEDAS * 24 * 3600_000));
    return {
      generadoEn: ahora, umbralMinimo: UMBRAL_MINIMO, diasBusquedas: DIAS_BUSQUEDAS,
      totales: {
        productoresActivos: (await this.usuarios.listar()).filter((u) => u.props.rol === 'Productor' && u.props.estado === 'Activo').length,
        productoresContactables: contactables.length, plantasEnCatalogo: visibles.length, plantasConFichaDeCultivoValidada: plantasConFicha.size, fichasDeCultivoValidadas: fichas, productosPublicados: productos.length,
      },
      productoresPorZona,
      productosPorCategoria: filas(contar(productos.flatMap((p) => p.props.categoriasUso ?? []))),
      productosPorTipoProductor: filas(contar(productos.map((p) => p.props.tipoProductor).filter((t): t is NonNullable<typeof t> => !!t))),
      plantasMasOfrecidas: filas(contar(productos.flatMap((p) => p.props.plantasIds).map((id) => nombrePlanta.get(id)).filter((n): n is string => !!n)), 10),
      plantasMasBuscadas: ordenar(busquedas.filter((b) => nombrePlanta.has(b.plantaId)).map((b) => ({ etiqueta: nombrePlanta.get(b.plantaId)!, cantidad: b.cantidad, oculto: false }))).slice(0, 10),
      notas: [
        'Datos agregados por zona, categoría y planta: no incluyen nombres, contactos, coordenadas ni ningún dato personal de productores.',
        `Los conteos de productores por zona con menos de ${UMBRAL_MINIMO} se muestran como "menos de ${UMBRAL_MINIMO}" para proteger la identidad de las personas.`,
        `"Plantas más buscadas" cuenta las búsquedas por nombre de los últimos ${DIAS_BUSQUEDAS} días, sin registrar quién buscó ni qué escribió.`,
      ],
    };
  }
}
