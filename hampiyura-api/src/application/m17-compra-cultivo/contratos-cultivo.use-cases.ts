import { randomUUID } from 'crypto';
import { ContratoCultivo, ContratoCultivoProps, MetodoCobroCultivo, PORCENTAJE_ADELANTO_CULTIVO, PORCENTAJE_COMISION_CULTIVO } from '../../domain/entities/contrato-cultivo.entity';
import { ContratoCultivoRepositoryPort } from '../../domain/ports/out/contrato-cultivo.repository.port';
import { CultivoRepositoryPort } from '../../domain/ports/out/cultivo.repository.port';
import { PlantaRepositoryPort } from '../../domain/ports/out/planta.repository.port';
import { UsuarioRepositoryPort } from '../../domain/ports/out/usuario.repository.port';
import { NotificadorPort } from '../../domain/ports/out/notificador.port';
import { NotFoundError, ValidationError } from '../../domain/errors/domain.errors';

// M-17 · Compra directa de cosecha (ligada a una ficha de cultivo de M-03, no a un producto de M-11). Es una
// operación distinta de "Publicar producto" (M-16, comisión 5%): aquí no hay precio de catálogo -- el comprador
// PROPONE un monto total por una cantidad, el agricultor lo acepta o lo rechaza tal cual (sin contraoferta), y la
// comisión referencial es del 3%, pagada aparte por el agricultor (igual que M-16, no se descuenta de nada).
export interface Solicitante { id: string; rol: string }
export interface ProponerContratoInput { cultivoId: string; cantidad: string; montoAcordado: number; mensaje?: string }
const redondear = (n: number) => Math.round(n * 100) / 100;

export class ContratosCultivoUseCase {
  constructor(
    private readonly contratos: ContratoCultivoRepositoryPort,
    private readonly cultivos: CultivoRepositoryPort,
    private readonly plantas: PlantaRepositoryPort,
    private readonly usuarios: UsuarioRepositoryPort,
    private readonly notificador: NotificadorPort,
  ) {}

  async proponer(compradorId: string, input: ProponerContratoInput, ahora = new Date()): Promise<ContratoCultivo> {
    const cantidad = (input.cantidad ?? '').trim();
    if (cantidad.length < 2) throw new ValidationError('Indica la cantidad que quieres pedir (ej. "50 kg")');
    if (!Number.isFinite(input.montoAcordado) || input.montoAcordado <= 0) throw new ValidationError('Indica un monto acordado válido, mayor a 0');
    const cultivo = await this.cultivos.buscarPorId(input.cultivoId);
    if (!cultivo || !cultivo.puedeMostrarseComoValidado()) throw new NotFoundError('Ficha de cultivo no encontrada');
    if (cultivo.props.autorId === compradorId) throw new ValidationError('No puedes proponerte un contrato a ti mismo');
    const [agricultor, comprador, planta] = await Promise.all([
      this.usuarios.buscarPorId(cultivo.props.autorId), this.usuarios.buscarPorId(compradorId), this.plantas.buscarPorId(cultivo.props.plantaId),
    ]);
    if (!agricultor || !comprador) throw new NotFoundError('Usuario no encontrado');
    if (agricultor.props.estado !== 'Activo') throw new ValidationError('El agricultor no está disponible');
    const montoAcordado = redondear(input.montoAcordado);
    const montoAdelanto = redondear(montoAcordado * PORCENTAJE_ADELANTO_CULTIVO / 100);
    const montoSaldo = redondear(montoAcordado - montoAdelanto);
    const comisionReferencial = redondear(montoAcordado * PORCENTAJE_COMISION_CULTIVO / 100);
    const netoAgricultor = redondear(montoAcordado - comisionReferencial);
    const id = randomUUID();
    const props: ContratoCultivoProps = {
      id, cultivoId: cultivo.props.id, plantaId: cultivo.props.plantaId, plantaNombre: planta?.props.nombreComun ?? 'Planta',
      agricultorId: agricultor.props.id, compradorId, cantidad, montoAcordado, montoAdelanto, montoSaldo, comisionReferencial, netoAgricultor,
      mensajeComprador: (input.mensaje ?? '').trim().slice(0, 500) || undefined,
      estado: 'Propuesto',
      eventos: [{ estado: 'Propuesto', fecha: ahora, actorId: compradorId, nota: `Propuesta: ${cantidad} por S/ ${montoAcordado.toFixed(2)}` }],
      creadoEn: ahora, actualizadoEn: ahora,
    };
    const contrato = new ContratoCultivo(props);
    await this.contratos.guardar(contrato);
    await this.notificador.notificar(agricultor.props.id, 'contrato_cultivo_propuesto', {
      entidadTipo: 'ContratoCultivo', entidadId: id,
      mensaje: `${comprador.props.nombre} te propone comprar ${cantidad} de tu cultivo de ${planta?.props.nombreComun ?? 'planta'} por S/ ${montoAcordado.toFixed(2)}.`,
    });
    return contrato;
  }

  private async cargar(id: string): Promise<ContratoCultivo> { const c = await this.contratos.buscarPorId(id); if (!c) throw new NotFoundError('Contrato no encontrado'); return c; }
  // Misma respuesta para "no existe" y "no es tuyo": no se revela que el contrato existe.
  private async cargarParticipante(id: string, u: Solicitante): Promise<ContratoCultivo> {
    const c = await this.cargar(id);
    if (!c.esParticipante(u.id) && u.rol !== 'Administrador') throw new NotFoundError('Contrato no encontrado');
    return c;
  }
  private async avisar(destinoId: string, tipo: string, c: ContratoCultivo, texto: string) {
    await this.notificador.notificar(destinoId, tipo, { entidadTipo: 'ContratoCultivo', entidadId: c.props.id, mensaje: texto });
  }

  async obtener(u: Solicitante, id: string) {
    const c = await this.cargarParticipante(id, u);
    const esComprador = u.id === c.props.compradorId; const esAgricultor = u.id === c.props.agricultorId;
    const [comprador, agricultor] = await Promise.all([this.usuarios.buscarPorId(c.props.compradorId), this.usuarios.buscarPorId(c.props.agricultorId)]);
    return {
      ...c.props,
      compradorNombre: comprador?.props.nombre, agricultorNombre: agricultor?.props.nombreNegocio ?? agricultor?.props.nombre,
      rolDelSolicitante: esComprador ? 'comprador' : esAgricultor ? 'agricultor' : 'administrador',
      acciones: this.accionesPara(c, u),
    };
  }
  private accionesPara(c: ContratoCultivo, u: Solicitante): string[] {
    const e = c.props.estado; const a: string[] = [];
    if (u.id === c.props.compradorId) {
      if (e === 'Propuesto' || (e === 'AdelantoPendiente' && !c.props.comprobanteAdelantoUrl)) a.push('cancelar');
      if (e === 'AdelantoPendiente' && !c.props.comprobanteAdelantoUrl) a.push('informarAdelanto');
    }
    if (u.id === c.props.agricultorId) {
      if (e === 'Propuesto') a.push('aceptar', 'rechazar');
      if (e === 'AdelantoPendiente' && c.props.comprobanteAdelantoUrl) a.push('confirmarAdelanto', 'rechazarAdelanto');
      if (e === 'EnCurso') a.push('marcarCompletado');
    }
    return a;
  }

  async listarMios(usuarioId: string, rol: 'comprador' | 'agricultor') {
    const lista = (await this.contratos.listarDe(usuarioId, rol)).sort((a, b) => b.props.creadoEn.getTime() - a.props.creadoEn.getTime());
    return Promise.all(lista.map(async (c) => {
      const otro = await this.usuarios.buscarPorId(rol === 'comprador' ? c.props.agricultorId : c.props.compradorId);
      return { id: c.props.id, plantaNombre: c.props.plantaNombre, cantidad: c.props.cantidad, montoAcordado: c.props.montoAcordado, estado: c.props.estado, creadoEn: c.props.creadoEn, con: otro?.props.nombreNegocio ?? otro?.props.nombre ?? '—' };
    }));
  }

  async aceptar(u: Solicitante, id: string, medio: MetodoCobroCultivo, numero: string, ahora = new Date()) {
    const c = await this.cargar(id); c.aceptar(u.id, medio, numero, ahora); await this.contratos.actualizar(c);
    await this.avisar(c.props.compradorId, 'contrato_cultivo_aceptado', c, `${c.props.plantaNombre}: el agricultor aceptó tu propuesta. Paga el adelanto de S/ ${c.props.montoAdelanto.toFixed(2)} por ${medio} y sube el comprobante.`);
  }
  async rechazar(u: Solicitante, id: string, motivo: string, ahora = new Date()) {
    const c = await this.cargar(id); c.rechazar(u.id, motivo, ahora); await this.contratos.actualizar(c);
    await this.avisar(c.props.compradorId, 'contrato_cultivo_rechazado', c, `El agricultor no aceptó tu propuesta de "${c.props.plantaNombre}": ${c.props.motivoRechazo}`);
  }
  async informarAdelanto(u: Solicitante, id: string, comprobanteUrl: string, numeroOperacion?: string, ahora = new Date()) {
    const c = await this.cargar(id); c.informarAdelanto(u.id, comprobanteUrl, numeroOperacion, ahora); await this.contratos.actualizar(c);
    await this.avisar(c.props.agricultorId, 'contrato_cultivo_adelanto_informado', c, `El comprador subió el comprobante del adelanto de "${c.props.plantaNombre}" (S/ ${c.props.montoAdelanto.toFixed(2)}). Confirma si lo recibiste.`);
  }
  async confirmarAdelanto(u: Solicitante, id: string, ahora = new Date()) {
    const c = await this.cargar(id); c.confirmarAdelanto(u.id, ahora); await this.contratos.actualizar(c);
    await this.avisar(c.props.compradorId, 'contrato_cultivo_en_curso', c, `El agricultor confirmó tu adelanto de "${c.props.plantaNombre}" y empezó a preparar la cosecha.`);
  }
  async rechazarAdelanto(u: Solicitante, id: string, motivo: string, ahora = new Date()) {
    const c = await this.cargar(id); c.rechazarAdelanto(u.id, motivo, ahora); await this.contratos.actualizar(c);
    await this.avisar(c.props.compradorId, 'contrato_cultivo_adelanto_rechazado', c, `El agricultor no pudo confirmar tu adelanto de "${c.props.plantaNombre}": ${c.props.motivoRechazoAdelanto}`);
  }
  async marcarCompletado(u: Solicitante, id: string, ahora = new Date()) {
    const c = await this.cargar(id); c.marcarCompletado(u.id, ahora); await this.contratos.actualizar(c);
    await this.avisar(c.props.compradorId, 'contrato_cultivo_completado', c, `Se completó el contrato de "${c.props.plantaNombre}": cosecha entregada.`);
  }
  async cancelar(u: Solicitante, id: string, ahora = new Date()) {
    const c = await this.cargar(id); c.cancelar(u.id, ahora); await this.contratos.actualizar(c);
    await this.avisar(c.props.agricultorId, 'contrato_cultivo_cancelado', c, `El comprador canceló la propuesta de "${c.props.plantaNombre}".`);
  }
}
