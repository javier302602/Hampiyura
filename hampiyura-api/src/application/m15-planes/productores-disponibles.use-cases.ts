import { AccesoContactoService, DirectorioProductoresUseCase, ProductorContactable, Solicitante } from './planes.use-cases';
import { DisponibilidadRepositoryPort } from '../../domain/ports/out/mensajeria-alertas.ports';
import { UnauthorizedError, ValidationError } from '../../domain/errors/domain.errors';

// Ronda 30 · complemento Premium (hipótesis de negocio SIN validar con especialistas ni productores reales, como todo M-15).
// "Productores disponibles": directorio explorable de productores que se marcaron "disponibles para contacto ahora". Bloqueado por
// defecto. Ronda 32: incluido sin costo extra en Empresarial e Institucional; con Negocio, solo con el complemento Premium (S/ 19). Muestra lo MISMO que el directorio de siempre (nombre,
// región, plantas, zona general, certificado): nunca ubicación exacta ni datos personales, y el CONTACTO sigue siendo del plan/desbloqueo.
export const DIAS_DISPONIBILIDAD = 7; // la marca vence sola si el productor no la renueva
const MS_DIA = 24 * 60 * 60 * 1000;

export interface ProductorDisponible extends ProductorContactable { disponibleHasta: Date; nota?: string }
export interface FiltrosDisponibles { planta?: string; zona?: string; tipo?: string }
export interface ListadoDisponibles { productores: ProductorDisponible[]; opciones: { plantas: string[]; zonas: string[]; tipos: string[] } }
const norm = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export class ProductoresDisponiblesUseCase {
  constructor(private readonly repo: DisponibilidadRepositoryPort, private readonly directorio: DirectorioProductoresUseCase, private readonly acceso: AccesoContactoService) {}

  // El productor se marca (o se desmarca) como disponible. Solo cuentas con rol Productor.
  async marcar(solicitante: Solicitante, disponible: boolean, nota?: string, ahora = new Date()): Promise<{ disponibleHasta: Date | null }> {
    if (solicitante.rol !== 'Productor') throw new UnauthorizedError('Solo las cuentas de Productor pueden marcarse como disponibles');
    if ((nota ?? '').length > 200) throw new ValidationError('La nota puede tener hasta 200 caracteres');
    if (disponible && !(await this.directorio.esContactable(solicitante.id))) throw new ValidationError('Para aparecer como disponible necesitas una ficha de cultivo validada (la misma condición del directorio de productores)');
    const hasta = disponible ? new Date(ahora.getTime() + DIAS_DISPONIBILIDAD * MS_DIA) : null;
    await this.repo.establecer(solicitante.id, hasta, nota);
    return { disponibleHasta: hasta };
  }
  async miEstado(productorId: string, ahora = new Date()): Promise<{ disponible: boolean; disponibleHasta?: Date; nota?: string; contactable: boolean }> {
    const d = await this.repo.obtener(productorId);
    return { disponible: !!d && d.hasta.getTime() > ahora.getTime(), disponibleHasta: d?.hasta, nota: d?.nota, contactable: await this.directorio.esContactable(productorId) };
  }

  async acceso_(solicitante: Solicitante | undefined) { return this.acceso.puedeVerProductoresDisponibles(solicitante); }

  async listar(solicitante: Solicitante | undefined, filtros: FiltrosDisponibles = {}, ahora = new Date()): Promise<ListadoDisponibles> {
    const permiso = await this.acceso.puedeVerProductoresDisponibles(solicitante, ahora);
    if (!permiso.permitido) throw new UnauthorizedError(permiso.motivo ?? 'Sección bloqueada');
    const vigentes = new Map((await this.repo.listarVigentes(ahora)).map((d) => [d.productorId, d]));
    const todos: ProductorDisponible[] = (await this.directorio.todos()).filter((p) => vigentes.has(p.id)).map((p) => ({ ...p, disponibleHasta: vigentes.get(p.id)!.hasta, nota: vigentes.get(p.id)!.nota }));
    const opciones = {
      plantas: [...new Set(todos.flatMap((p) => p.plantas))].sort((a, b) => a.localeCompare(b, 'es')),
      zonas: [...new Set(todos.flatMap((p) => [...p.zonas, ...p.zonasProducto]))].sort((a, b) => a.localeCompare(b, 'es')),
      tipos: [...new Set(todos.flatMap((p) => p.tiposProductor))].sort((a, b) => a.localeCompare(b, 'es')),
    };
    let salida = todos;
    if (filtros.planta?.trim()) salida = salida.filter((p) => p.plantas.some((x) => norm(x).includes(norm(filtros.planta!.trim()))));
    if (filtros.zona?.trim()) salida = salida.filter((p) => [...p.zonas, ...p.zonasProducto].some((z) => norm(z).includes(norm(filtros.zona!.trim()))));
    if (filtros.tipo?.trim()) salida = salida.filter((p) => p.tiposProductor.includes(filtros.tipo!.trim()));
    return { productores: salida, opciones };
  }
}
