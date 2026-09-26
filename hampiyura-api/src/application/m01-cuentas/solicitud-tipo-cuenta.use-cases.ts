import { randomUUID } from 'crypto';
import { SolicitudCuenta, validarSolicitud } from '../../domain/entities/solicitud-cuenta.entity';
import { ValidacionContenido } from '../../domain/entities/validacion-contenido.entity';
import { SolicitudCuentaRepositoryPort } from '../../domain/ports/out/solicitud-cuenta.repository.port';
import { ValidacionContenidoRepositoryPort } from '../../domain/ports/out/validacion-contenido.repository.port';
import { UsuarioRepositoryPort } from '../../domain/ports/out/usuario.repository.port';
import { EntidadValidableRepositoryPort } from '../../domain/ports/out/entidad-validable.repository.port';
import { EstadoValidacion } from '../../domain/value-objects/estado-validacion.vo';
import { TipoCuenta, esTipoCuenta, ETIQUETA_TIPO_CUENTA, ROLES_QUE_PUEDEN_SOLICITAR } from '../../domain/value-objects/tipo-cuenta.vo';
import { NotFoundError, ValidationError } from '../../domain/errors/domain.errors';

export interface SolicitarTipoCuentaInput { usuarioId: string; tipo: string; nombreOrganizacion?: string; descripcion: string; identificacion?: string; sitioWeb?: string; }

export class SolicitarTipoCuentaUseCase {
  constructor(private readonly solicitudes: SolicitudCuentaRepositoryPort, private readonly validaciones: ValidacionContenidoRepositoryPort, private readonly usuarios: UsuarioRepositoryPort) {}
  async ejecutar(input: SolicitarTipoCuentaInput): Promise<SolicitudCuenta> {
    const usuario = await this.usuarios.buscarPorId(input.usuarioId);
    if (!usuario) throw new NotFoundError('Usuario no encontrado');
    if (usuario.props.estado !== 'Activo') throw new ValidationError('Tu cuenta debe estar activa para solicitar un cambio de tipo de cuenta');
    if (!esTipoCuenta(input.tipo)) throw new ValidationError('Elige Productor, Empresario o Institución de investigación');
    if (!(ROLES_QUE_PUEDEN_SOLICITAR as readonly string[]).includes(usuario.props.rol) || usuario.props.tipoCuenta) {
      throw new ValidationError('Tu cuenta ya tiene un tipo asignado; este cambio es para cuentas normales');
    }
    if ((await this.solicitudes.listarPorUsuario(input.usuarioId)).some((s) => s.estaEnCurso())) throw new ValidationError('Ya tienes una solicitud pendiente de aprobación');
    validarSolicitud({ tipoSolicitado: input.tipo, nombreOrganizacion: input.nombreOrganizacion, descripcion: input.descripcion, sitioWeb: input.sitioWeb });
    const solicitud = new SolicitudCuenta({
      id: randomUUID(), usuarioId: input.usuarioId, tipoSolicitado: input.tipo,
      nombreOrganizacion: input.nombreOrganizacion?.trim() || undefined, descripcion: input.descripcion.trim(),
      identificacion: input.identificacion?.trim() || undefined, sitioWeb: input.sitioWeb?.trim() || undefined,
      estadoValidacion: 'Pendiente', creadaEn: new Date(),
    });
    await this.solicitudes.guardar(solicitud);
    await this.validaciones.guardar(new ValidacionContenido({ id: randomUUID(), tipoEntidad: 'SolicitudCuenta', entidadId: solicitud.props.id, estado: 'Pendiente', fecha: new Date(), autorId: input.usuarioId }));
    return solicitud;
  }
}

export interface MiSolicitudTipoCuenta {
  id: string; tipo: TipoCuenta; etiquetaTipo: string; estado: EstadoValidacion; creadaEn: Date;
  comentarioDelEquipo?: string;
}
export interface MiTipoCuenta { tipoCuenta: TipoCuenta | null; puedeSolicitar: boolean; solicitud: MiSolicitudTipoCuenta | null; }
// Lo que ve la persona en su perfil: su tipo actual, si puede pedir el cambio y el estado de su última solicitud
// (con lo que le comentó el equipo si la observó o rechazó). No tiene relación con los planes de pago.
export class ObtenerMiTipoCuentaUseCase {
  constructor(private readonly solicitudes: SolicitudCuentaRepositoryPort, private readonly validaciones: ValidacionContenidoRepositoryPort, private readonly usuarios: UsuarioRepositoryPort) {}
  async ejecutar(usuarioId: string): Promise<MiTipoCuenta> {
    const usuario = await this.usuarios.buscarPorId(usuarioId);
    if (!usuario) throw new NotFoundError('Usuario no encontrado');
    const ultima = (await this.solicitudes.listarPorUsuario(usuarioId)).sort((a, b) => b.props.creadaEn.getTime() - a.props.creadaEn.getTime())[0];
    let comentario: string | undefined;
    if (ultima) comentario = (await this.validaciones.listar()).filter((v) => v.props.entidadId === ultima.props.id).sort((a, b) => b.props.fecha.getTime() - a.props.fecha.getTime())[0]?.props.comentarioValidador;
    const tipoCuenta = (usuario.props.tipoCuenta && esTipoCuenta(usuario.props.tipoCuenta) ? usuario.props.tipoCuenta : null);
    const puedeSolicitar = usuario.props.estado === 'Activo' && !tipoCuenta && (ROLES_QUE_PUEDEN_SOLICITAR as readonly string[]).includes(usuario.props.rol) && !(ultima?.estaEnCurso());
    return {
      tipoCuenta, puedeSolicitar,
      solicitud: ultima ? { id: ultima.props.id, tipo: ultima.props.tipoSolicitado, etiquetaTipo: ETIQUETA_TIPO_CUENTA[ultima.props.tipoSolicitado], estado: ultima.props.estadoValidacion, creadaEn: ultima.props.creadaEn, comentarioDelEquipo: comentario } : null,
    };
  }
}

// Registrado en el mapa de entidades validables de M-09: cuando un administrador APRUEBA la solicitud, aquí se aplica el
// cambio (tipo de cuenta; y el rol Productor si eligió Productor). Rechazar u observar solo guarda el estado.
export class SolicitudCuentaValidable implements EntidadValidableRepositoryPort {
  constructor(private readonly solicitudes: SolicitudCuentaRepositoryPort, private readonly usuarios: UsuarioRepositoryPort) {}
  async actualizarEstadoValidacion(id: string, estado: EstadoValidacion): Promise<void> {
    await this.solicitudes.actualizarEstadoValidacion(id, estado);
    if (estado !== 'Validado') return;
    const s = await this.solicitudes.buscarPorId(id);
    if (!s) return;
    const usuario = await this.usuarios.buscarPorId(s.props.usuarioId);
    if (!usuario) return;
    usuario.props.tipoCuenta = s.props.tipoSolicitado;
    if (s.props.tipoSolicitado === 'Productor') usuario.props.rol = 'Productor';
    if (s.props.nombreOrganizacion) usuario.props.nombreNegocio = s.props.nombreOrganizacion;
    await this.usuarios.actualizar(usuario);
  }
}
