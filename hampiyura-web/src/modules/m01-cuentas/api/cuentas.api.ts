import { apiRequest } from '../../../shared/api/client';

// tipoRegistro decide rol/estado en el backend (RegistrarUsuarioUseCase): 'personal' (default)
// queda Activo de inmediato; 'empresa' queda PendienteActivacion (rol Productor) hasta usar el
// token de activación -- separa el registro de una persona del de un emprendimiento que va a
// publicar productos en el directorio público.
export interface RegistroInput { nombre: string; correo: string; contraseña: string; contraseñaConfirmacion: string; tipoRegistro?: 'personal' | 'empresa'; }
export interface RegistroResultado { id: string; nombre: string; correo: string; rol: string; estado: string; }
export function registrar(input: RegistroInput): Promise<RegistroResultado> {
  return apiRequest<RegistroResultado>('/cuentas/registro', { method: 'POST', body: JSON.stringify(input) });
}

export interface LoginResultado { token: string; usuario: { id: string; correo: string; rol: string }; }
export function login(correo: string, contraseña: string): Promise<LoginResultado> {
  return apiRequest<LoginResultado>('/cuentas/login', { method: 'POST', body: JSON.stringify({ correo, contraseña }) });
}

export function activarCuenta(token: string): Promise<{ mensaje: string }> {
  return apiRequest('/cuentas/activar', { method: 'POST', body: JSON.stringify({ token }) });
}

export function solicitarRecuperacion(correo: string): Promise<{ mensaje: string }> {
  return apiRequest('/cuentas/recuperar-contrasena', { method: 'POST', body: JSON.stringify({ correo }) });
}

export function restablecerContrasena(token: string, contraseñaNueva: string, confirmacion: string): Promise<{ mensaje: string }> {
  return apiRequest('/cuentas/restablecer-contrasena', { method: 'POST', body: JSON.stringify({ token, contraseñaNueva, confirmacion }) });
}

export function cambiarContrasena(contraseñaActual: string, contraseñaNueva: string, confirmacion: string): Promise<{ mensaje: string }> {
  return apiRequest('/cuentas/cambiar-contrasena', { method: 'POST', body: JSON.stringify({ contraseñaActual, contraseñaNueva, confirmacion }) });
}

// GET /cuentas/perfil no existía en el backend (FASE 7 solo dejó login/registro/recuperación) --
// se agregó ahora porque sin él "perfil básico" es irrecuperable tras refrescar la página (el JWT
// solo trae sub+rol, y login() no devuelve nombre). Ver Plan de Gestión de Cambios.
export interface Perfil { id: string; nombre: string; correo: string; rol: string; idioma: string; nivelConocimiento: string; region: string; estado: string; aceptoComisionEn?: string | null; telefono?: string | null; biografia?: string | null; nombreNegocio?: string | null; tipoCuenta?: string | null; }
export function obtenerPerfil(): Promise<Perfil> { return apiRequest<Perfil>('/cuentas/perfil'); }

// Solicitud de cambio de tipo de cuenta: queda pendiente hasta que un administrador la apruebe (bandeja de validación).
export type TipoCuentaSolicitable = 'Productor' | 'Empresario' | 'Institucion';
export const TIPOS_CUENTA: { valor: TipoCuentaSolicitable; etiqueta: string; ayuda: string }[] = [
  { valor: 'Productor', etiqueta: 'Productor', ayuda: 'Cultivas, recolectas o elaboras productos con plantas. Publicar es gratis.' },
  { valor: 'Empresario', etiqueta: 'Empresario', ayuda: 'Tienes un negocio (cosmética natural, gastronomía, herbolario…) y buscas contactar productores.' },
  { valor: 'Institucion', etiqueta: 'Institución de investigación', ayuda: 'Universidad, ONG, centro de investigación o entidad pública.' },
];
export interface MiTipoCuenta {
  tipoCuenta: TipoCuentaSolicitable | null;
  puedeSolicitar: boolean;
  solicitud: { id: string; tipo: TipoCuentaSolicitable; etiquetaTipo: string; estado: string; creadaEn: string; comentarioDelEquipo?: string; plan: { id: string; nombre: string; precioTexto: string; gratis: boolean } } | null;
}
export function obtenerMiTipoCuenta(): Promise<MiTipoCuenta> { return apiRequest<MiTipoCuenta>('/cuentas/solicitud-tipo-cuenta'); }
export interface SolicitarTipoCuentaInput { tipo: TipoCuentaSolicitable; nombreOrganizacion?: string; descripcion: string; identificacion?: string; sitioWeb?: string; }
export function solicitarTipoCuenta(input: SolicitarTipoCuentaInput): Promise<unknown> {
  return apiRequest('/cuentas/solicitud-tipo-cuenta', { method: 'POST', body: JSON.stringify(input) });
}

// Campos básicos editables del perfil. Cadena vacía = borrar el campo. nombreNegocio solo lo acepta el rol Productor.
export interface ActualizarPerfilInput { telefono?: string; region?: string; biografia?: string; nombreNegocio?: string; }
export function actualizarPerfil(input: ActualizarPerfilInput): Promise<Perfil> {
  return apiRequest<Perfil>('/cuentas/perfil', { method: 'PATCH', body: JSON.stringify(input) });
}
