import { randomUUID } from 'crypto';
import { AccesoContactoService } from './planes.use-cases';
import { AlertasRepositoryPort, AlertaDatos } from '../../domain/ports/out/mensajeria-alertas.ports';
import { PlantaRepositoryPort } from '../../domain/ports/out/planta.repository.port';
import { CultivoRepositoryPort } from '../../domain/ports/out/cultivo.repository.port';
import { ProductoRepositoryPort } from '../../domain/ports/out/producto.repository.port';
import { NotificadorPort } from '../../domain/ports/out/notificador.port';
import { UsuarioRepositoryPort } from '../../domain/ports/out/usuario.repository.port';
import { tieneMensajeriaYAlertas } from '../../domain/value-objects/plan.vo';
import { NotFoundError, UnauthorizedError, ValidationError } from '../../domain/errors/domain.errors';

// Ronda 30 · Plan Negocio: alertas de disponibilidad y de temporada de las plantas que el usuario sigue.
//  - DISPONIBILIDAD: hay productos APROBADOS en la plataforma que usan esa planta. Se avisa de los productos nuevos (una sola vez cada uno).
//  - TEMPORADA: el mes actual es mes de cosecha en al menos una ficha de cultivo VALIDADA de esa planta. Se avisa una vez por mes.
// Solo se avisa a quien tenga un plan Negocio o superior VIGENTE en ese momento (si el plan vence, las alertas se guardan pero no avisan).
export interface AlertaVisible {
  plantaId: string; plantaNombre: string; disponibilidad: boolean; temporada: boolean;
  productosDisponiblesAhora: number; enTemporadaAhora: boolean; mesesCosecha: number[]; creadoEn: Date;
}
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
export const nombreDeMes = (m: number) => MESES[m - 1];

export class AlertasUseCase {
  constructor(
    private readonly repo: AlertasRepositoryPort, private readonly plantas: PlantaRepositoryPort, private readonly cultivos: CultivoRepositoryPort,
    private readonly productos: ProductoRepositoryPort, private readonly notificador: NotificadorPort, private readonly acceso: AccesoContactoService, private readonly usuarios: UsuarioRepositoryPort,
  ) {}

  private async tienePlan(usuarioId: string): Promise<boolean> {
    const u = await this.usuarios.buscarPorId(usuarioId);
    if (u?.props.rol === 'Administrador') return true;
    return tieneMensajeriaYAlertas((await this.acceso.planActivo(usuarioId)).plan);
  }

  private async estadoDe(plantaId: string, ahora: Date) {
    const productosIds = (await this.productos.listar()).filter((p) => p.esVisiblePublicamente() && p.props.plantasIds.includes(plantaId)).map((p) => p.props.id);
    const mesesCosecha = [...new Set((await this.cultivos.listarPorPlanta(plantaId)).filter((c) => c.props.estadoValidacion === 'Validado').flatMap((c) => c.props.calendario.mesesCosecha))].sort((a, b) => a - b);
    return { productosIds, mesesCosecha, enTemporada: mesesCosecha.includes(ahora.getMonth() + 1) };
  }

  async seguir(usuarioId: string, plantaId: string, opciones: { disponibilidad?: boolean; temporada?: boolean }, ahora = new Date()): Promise<void> {
    if (!(await this.tienePlan(usuarioId))) throw new UnauthorizedError('Las alertas son del plan Negocio o superior (con un plan de pago vigente)');
    const planta = await this.plantas.buscarPorId(plantaId);
    if (!planta || !planta.esVisiblePublicamente()) throw new NotFoundError('Planta no encontrada');
    const disponibilidad = opciones.disponibilidad ?? true; const temporada = opciones.temporada ?? true;
    if (!disponibilidad && !temporada) throw new ValidationError('Elige al menos un tipo de alerta: disponibilidad o temporada');
    const previa = await this.repo.buscar(usuarioId, plantaId);
    await this.repo.guardar({ id: previa?.id ?? randomUUID(), usuarioId, plantaId, disponibilidad, temporada, productosNotificados: previa?.productosNotificados ?? [], ultimaTemporada: previa?.ultimaTemporada, creadoEn: previa?.creadoEn ?? ahora });
    await this.procesarUsuario(usuarioId, ahora); // si ya hay algo disponible, se avisa de una vez
  }

  async dejarDeSeguir(usuarioId: string, plantaId: string): Promise<void> { await this.repo.eliminar(usuarioId, plantaId); }

  async listar(usuarioId: string, ahora = new Date()): Promise<AlertaVisible[]> {
    const alertas = await this.repo.listarPorUsuario(usuarioId);
    const salida: AlertaVisible[] = [];
    for (const a of alertas) {
      const planta = await this.plantas.buscarPorId(a.plantaId);
      if (!planta) continue;
      const e = await this.estadoDe(a.plantaId, ahora);
      salida.push({ plantaId: a.plantaId, plantaNombre: planta.props.nombreComun, disponibilidad: a.disponibilidad, temporada: a.temporada, productosDisponiblesAhora: e.productosIds.length, enTemporadaAhora: e.enTemporada, mesesCosecha: e.mesesCosecha, creadoEn: a.creadoEn });
    }
    return salida;
  }

  // Revisa las alertas de un usuario y manda las notificaciones que correspondan. Idempotente: no repite lo ya avisado.
  async procesarUsuario(usuarioId: string, ahora = new Date()): Promise<number> {
    if (!(await this.tienePlan(usuarioId))) return 0;
    return this.procesar(await this.repo.listarPorUsuario(usuarioId), ahora);
  }
  // Revisa TODAS las alertas (lo llama el proceso periódico del servidor o un administrador).
  async procesarTodas(ahora = new Date()): Promise<number> {
    const porUsuario = new Map<string, AlertaDatos[]>();
    for (const a of await this.repo.listarTodas()) porUsuario.set(a.usuarioId, [...(porUsuario.get(a.usuarioId) ?? []), a]);
    let total = 0;
    for (const [usuarioId, alertas] of porUsuario) if (await this.tienePlan(usuarioId)) total += await this.procesar(alertas, ahora);
    return total;
  }

  private async procesar(alertas: AlertaDatos[], ahora: Date): Promise<number> {
    let enviadas = 0;
    for (const a of alertas) {
      const planta = await this.plantas.buscarPorId(a.plantaId);
      if (!planta) continue;
      const e = await this.estadoDe(a.plantaId, ahora);
      let cambio = false;
      if (a.disponibilidad) {
        const nuevos = e.productosIds.filter((id) => !a.productosNotificados.includes(id));
        if (nuevos.length > 0) {
          await this.notificador.notificar(a.usuarioId, 'alerta_disponibilidad', { entidadTipo: 'Planta', entidadId: a.plantaId, mensaje: `Disponibilidad: ${nuevos.length === 1 ? 'hay 1 producto nuevo' : `hay ${nuevos.length} productos nuevos`} con ${planta.props.nombreComun} en la plataforma.` });
          a.productosNotificados = [...a.productosNotificados, ...nuevos]; cambio = true; enviadas++;
        }
      }
      if (a.temporada && e.enTemporada) {
        const clave = `${ahora.getFullYear()}-${ahora.getMonth() + 1}`;
        if (a.ultimaTemporada !== clave) {
          await this.notificador.notificar(a.usuarioId, 'alerta_temporada', { entidadTipo: 'Planta', entidadId: a.plantaId, mensaje: `Temporada: ${planta.props.nombreComun} está en su época de cosecha (${nombreDeMes(ahora.getMonth() + 1)}), según las fichas de cultivo validadas.` });
          a.ultimaTemporada = clave; cambio = true; enviadas++;
        }
      }
      if (cambio) await this.repo.guardar(a);
    }
    return enviadas;
  }
}
