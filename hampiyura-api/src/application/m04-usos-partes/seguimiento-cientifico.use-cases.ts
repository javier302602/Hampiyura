import { ParteUso, ValidacionCientificaProps } from '../../domain/entities/parte-uso.entity';
import { ParteUsoRepositoryPort } from '../../domain/ports/out/parte-uso.repository.port';
import { PlantaRepositoryPort } from '../../domain/ports/out/planta.repository.port';
import { UsoRepositoryPort } from '../../domain/ports/out/uso.repository.port';
import { UsuarioRepositoryPort } from '../../domain/ports/out/usuario.repository.port';
import { NotificadorPort } from '../../domain/ports/out/notificador.port';
import { NotFoundError } from '../../domain/errors/domain.errors';

// Seguimiento científico de usos ya aprobados (Tradicional, Documentado o Científico; M-04/M-09). Todo esto es interno: solo Especialista en
// salud o Administrador (ver ParteUso.exigirRolDeSeguimiento); el público solo ve el sello de "verificado" cuando
// existe evidencia registrada (ParteUso.puedeMostrarseComoVerificado).

export interface ItemSeguimiento {
  id: string;
  etiqueta: string;
  autorNombre: string;
  tipoConocimiento: string;
  tieneContactoSeguimiento: boolean;
  validadaCientificamente: boolean;
}
export interface DetalleSeguimiento {
  id: string;
  etiqueta: string;
  autorNombre: string;
  estadoValidacion: string;
  tipoConocimiento: string;
  campos: { etiqueta: string; valor: string }[];
  contactoSeguimiento: string | null;
  puedeRegistrarValidacionCientifica: boolean;
  // Visible solo para quien audita (Especialista/Administrador): nunca sale por la API pública.
  validacionCientifica: (Omit<ValidacionCientificaProps, 'registradaPorId'> & { registradaPorNombre: string }) | null;
}

class Base {
  constructor(protected readonly partes: ParteUsoRepositoryPort, protected readonly plantas: PlantaRepositoryPort, protected readonly usos: UsoRepositoryPort, protected readonly usuarios: UsuarioRepositoryPort) {}
  protected async cargar(id: string): Promise<ParteUso> {
    const p = await this.partes.buscarPorId(id);
    if (!p) throw new NotFoundError(`Parte+Uso no encontrado: ${id}`);
    return p;
  }
  protected async etiqueta(p: ParteUso): Promise<string> {
    const planta = await this.plantas.buscarPorId(p.props.plantaId);
    const parte = p.props.parte === 'Otra' && p.props.parteDetalle ? p.props.parteDetalle : p.props.parte;
    return `Uso de ${parte} — ${planta?.props.nombreComun ?? p.props.plantaId}`;
  }
}

export class ListarSeguimientoUseCase extends Base {
  // Aprobados de tipo Tradicional, Documentado o Científico SIN evidencia registrada (por validar) + los que ya la tienen.
  async ejecutar(rol: string): Promise<ItemSeguimiento[]> {
    ParteUso.exigirRolDeSeguimiento(rol);
    const todos = (await this.partes.listar()).filter((p) => p.props.estadoValidacion === 'Validado' && (p.puedeRegistrarValidacionCientifica() || p.tieneEvidenciaCientifica()));
    return Promise.all(todos.map(async (p) => ({
      id: p.props.id, etiqueta: await this.etiqueta(p), autorNombre: (await this.usuarios.buscarPorId(p.props.autorId))?.props.nombre ?? p.props.autorId,
      tipoConocimiento: p.props.tipoConocimiento, tieneContactoSeguimiento: !!p.props.contactoSeguimiento, validadaCientificamente: p.tieneEvidenciaCientifica(),
    })));
  }
}

export class ObtenerSeguimientoUseCase extends Base {
  async ejecutar(id: string, rol: string): Promise<DetalleSeguimiento> {
    ParteUso.exigirRolDeSeguimiento(rol);
    const p = await this.cargar(id);
    const uso = await this.usos.buscarPorId(p.props.usoId);
    const v = p.props.validacionCientifica;
    const registradaPor = v ? (await this.usuarios.buscarPorId(v.registradaPorId))?.props.nombre ?? v.registradaPorId : '';
    const campos = [
      { etiqueta: 'Parte utilizada', valor: p.props.parte === 'Otra' && p.props.parteDetalle ? `Otra: ${p.props.parteDetalle}` : p.props.parte },
      { etiqueta: 'Uso / finalidad', valor: uso?.props.nombre ?? p.props.usoId },
      { etiqueta: 'Para qué se usa y por qué', valor: p.props.motivoUso ?? 'No informado' },
      { etiqueta: 'Tipo de conocimiento', valor: p.props.tipoConocimiento },
      { etiqueta: 'Fuente', valor: p.props.fuente.valor },
      ...(p.props.contraindicaciones ? [{ etiqueta: 'Contraindicaciones (según la fuente)', valor: p.props.contraindicaciones }] : []),
    ];
    return {
      id: p.props.id, etiqueta: await this.etiqueta(p), autorNombre: (await this.usuarios.buscarPorId(p.props.autorId))?.props.nombre ?? p.props.autorId,
      estadoValidacion: p.props.estadoValidacion, tipoConocimiento: p.props.tipoConocimiento, campos,
      contactoSeguimiento: p.props.contactoSeguimiento ?? null,
      puedeRegistrarValidacionCientifica: p.puedeRegistrarValidacionCientifica(),
      validacionCientifica: v ? { especialista: v.especialista, fecha: v.fecha, evidencia: v.evidencia, enlace: v.enlace, registradaEn: v.registradaEn, registradaPorNombre: registradaPor } : null,
    };
  }
}

export class ActualizarContactoSeguimientoUseCase extends Base {
  async ejecutar(id: string, rol: string, contacto: string | null | undefined): Promise<void> {
    ParteUso.exigirRolDeSeguimiento(rol);
    const p = await this.cargar(id);
    p.actualizarContactoSeguimiento(contacto);
    await this.partes.actualizar(p);
  }
}

export interface RegistrarValidacionCientificaCmd { especialista: string; fecha: Date; evidencia: string; enlace?: string; }
export class RegistrarValidacionCientificaUseCase extends Base {
  constructor(partes: ParteUsoRepositoryPort, plantas: PlantaRepositoryPort, usos: UsoRepositoryPort, usuarios: UsuarioRepositoryPort, private readonly notificador: NotificadorPort) { super(partes, plantas, usos, usuarios); }
  async ejecutar(id: string, usuario: { id: string; rol: string }, cmd: RegistrarValidacionCientificaCmd): Promise<void> {
    ParteUso.exigirRolDeSeguimiento(usuario.rol);
    const p = await this.cargar(id);
    p.registrarValidacionCientifica({ ...cmd, registradaPorId: usuario.id });
    await this.partes.actualizar(p);
    // Se le avisa a quien aportó el conocimiento: su uso ahora tiene el sello de verificado.
    await this.notificador.notificar(p.props.autorId, 'validacion_cientifica_registrada', { entidadTipo: 'ParteUso', entidadId: p.props.id });
  }
}
