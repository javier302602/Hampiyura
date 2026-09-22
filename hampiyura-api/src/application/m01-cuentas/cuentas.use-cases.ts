import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { Usuario } from '../../domain/entities/usuario.entity';
import { TokenAccion } from '../../domain/entities/token-accion.entity';
import { UsuarioRepositoryPort } from '../../domain/ports/out/usuario.repository.port';
import { TokenAccionRepositoryPort } from '../../domain/ports/out/token-accion.repository.port';
import { EmailPort } from '../../domain/ports/out/email.port';
import { ContraseñaSegura } from '../../domain/value-objects/contrasena-segura.vo';
import { PerfilVisible } from '../../domain/ports/in/m01-cuentas/obtener-perfil.port';
import { NotFoundError, UnauthorizedError, ValidationError } from '../../domain/errors/domain.errors';

const MINUTOS = 60 * 1000;
const EXPIRACION_ACTIVACION_MIN = 60 * 24;
const EXPIRACION_RECUPERACION_MIN = 15;

function validarConfirmacion(nueva: string, confirmacion: string) { if (nueva !== confirmacion) throw new ValidationError('La confirmación de contraseña no coincide'); }

export interface AuthInput { nombre?:string; correo:string; contraseña:string; contraseñaConfirmacion:string; rol?:Usuario['props']['rol']; }
// CG-005 (21/09/2026): el registro dejó de requerir verificación de correo antes de dar acceso --
// la cuenta queda 'Activo' de inmediato (antes: 'PendienteActivacion', sin poder entrar hasta
// activarla). Revierte un criterio Must original del SDS v1 (RF-01), decisión de equipo: el
// registro no debe tener fricción para nadie.
//
// El token/correo de activación NO se elimina: se sigue generando y "enviando" (log de consola en
// desarrollo, ver ConsoleEmailAdapter) en cada registro, pero ya NO es obligatorio para entrar --
// queda reservado para un futuro tipo de cuenta con beneficios, aún sin definir (ver CG-005). Así,
// cualquier flujo de prueba que todavía quiera ejercitar ActivarCuentaUseCase tiene un token real
// disponible en el log, sin tener que ir a la base de datos a buscarlo.
export class RegistrarUsuarioUseCase {
  constructor(private readonly repo:UsuarioRepositoryPort, private readonly tokens:TokenAccionRepositoryPort, private readonly email:EmailPort) {}
  async ejecutar(input:AuthInput):Promise<Usuario> {
    if (!input.nombre?.trim()) throw new ValidationError('El nombre es obligatorio');
    if (await this.repo.buscarPorCorreo(input.correo)) throw new ValidationError('El correo ya está registrado');
    validarConfirmacion(input.contraseña, input.contraseñaConfirmacion);
    const contraseña = new ContraseñaSegura(input.contraseña);
    const usuario = new Usuario({id:randomUUID(), nombre:input.nombre, correo:input.correo, contraseñaHash:await bcrypt.hash(contraseña.valor, 10), rol:input.rol ?? 'UsuarioRegistrado', idioma:'es', nivelConocimiento:'Pendiente', region:'Pendiente', estado:'Activo'});
    await this.repo.guardar(usuario);
    const token = new TokenAccion({id:randomUUID(), usuarioId:usuario.props.id, tipo:'Activacion', token:randomUUID(), expiracion:new Date(Date.now()+EXPIRACION_ACTIVACION_MIN*MINUTOS), usado:false});
    await this.tokens.guardar(token);
    await this.email.enviarActivacion(usuario.props.correo, token.props.token);
    return usuario;
  }
}
export class LoginUseCase {
  constructor(private readonly repo:UsuarioRepositoryPort, private readonly secret:string) {}
  async ejecutar(correo:string, contraseña:string):Promise<{token:string; usuario:Usuario}> {
    const usuario=await this.repo.buscarPorCorreo(correo);
    if (!usuario || !(await bcrypt.compare(contraseña, usuario.props.contraseñaHash))) throw new NotFoundError('Credenciales inválidas');
    if (usuario.props.estado === 'Suspendido') throw new UnauthorizedError('La cuenta está suspendida');
    if (usuario.props.estado !== 'Activo') throw new UnauthorizedError('La cuenta no ha sido activada; revisa tu correo');
    const token=jwt.sign({sub:usuario.props.id, rol:usuario.props.rol}, this.secret, {expiresIn:'1d'});
    return {token, usuario};
  }
}
export class ActivarCuentaUseCase {
  constructor(private readonly tokens:TokenAccionRepositoryPort, private readonly usuarios:UsuarioRepositoryPort) {}
  async ejecutar(token:string):Promise<void> {
    const registro = await this.tokens.buscarPorToken(token);
    if (!registro || registro.props.tipo !== 'Activacion' || !registro.estaVigente()) throw new ValidationError('Enlace de activación inválido o vencido');
    const usuario = await this.usuarios.buscarPorId(registro.props.usuarioId);
    if (!usuario) throw new NotFoundError('Usuario no encontrado');
    usuario.props.estado = 'Activo';
    await this.usuarios.actualizar(usuario);
    registro.marcarUsado();
    await this.tokens.guardar(registro);
  }
}
export class SolicitarRecuperacionContraseñaUseCase {
  constructor(private readonly usuarios:UsuarioRepositoryPort, private readonly tokens:TokenAccionRepositoryPort, private readonly email:EmailPort) {}
  async ejecutar(correo:string):Promise<void> {
    const usuario = await this.usuarios.buscarPorCorreo(correo);
    if (!usuario) throw new NotFoundError('Usuario no encontrado');
    const token = new TokenAccion({id:randomUUID(), usuarioId:usuario.props.id, tipo:'RecuperacionContrasena', token:randomUUID(), expiracion:new Date(Date.now()+EXPIRACION_RECUPERACION_MIN*MINUTOS), usado:false});
    await this.tokens.guardar(token);
    await this.email.enviarRecuperacion(usuario.props.correo, token.props.token);
  }
}
export class RestablecerContraseñaUseCase {
  constructor(private readonly tokens:TokenAccionRepositoryPort, private readonly usuarios:UsuarioRepositoryPort) {}
  async ejecutar(token:string, contraseñaNueva:string, confirmacion:string):Promise<void> {
    const registro = await this.tokens.buscarPorToken(token);
    if (!registro || registro.props.tipo !== 'RecuperacionContrasena' || !registro.estaVigente()) throw new ValidationError('Enlace de recuperación inválido o vencido');
    validarConfirmacion(contraseñaNueva, confirmacion);
    const contraseña = new ContraseñaSegura(contraseñaNueva);
    const usuario = await this.usuarios.buscarPorId(registro.props.usuarioId);
    if (!usuario) throw new NotFoundError('Usuario no encontrado');
    usuario.props.contraseñaHash = await bcrypt.hash(contraseña.valor, 10);
    await this.usuarios.actualizar(usuario);
    registro.marcarUsado();
    await this.tokens.guardar(registro);
  }
}
export class ObtenerPerfilUseCase {
  constructor(private readonly usuarios:UsuarioRepositoryPort) {}
  async ejecutar(usuarioId:string):Promise<PerfilVisible> {
    const usuario = await this.usuarios.buscarPorId(usuarioId);
    if (!usuario) throw new NotFoundError('Usuario no encontrado');
    const { contraseñaHash, ...perfil } = usuario.props;
    return perfil;
  }
}
export class CambiarContraseñaUseCase {
  constructor(private readonly usuarios:UsuarioRepositoryPort) {}
  async ejecutar(usuarioId:string, contraseñaActual:string, contraseñaNueva:string, confirmacion:string):Promise<void> {
    const usuario = await this.usuarios.buscarPorId(usuarioId);
    if (!usuario) throw new NotFoundError('Usuario no encontrado');
    if (!(await bcrypt.compare(contraseñaActual, usuario.props.contraseñaHash))) throw new UnauthorizedError('La contraseña actual no coincide');
    validarConfirmacion(contraseñaNueva, confirmacion);
    const contraseña = new ContraseñaSegura(contraseñaNueva);
    usuario.props.contraseñaHash = await bcrypt.hash(contraseña.valor, 10);
    await this.usuarios.actualizar(usuario);
  }
}
