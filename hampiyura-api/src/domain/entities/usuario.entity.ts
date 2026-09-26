import { Rol } from '../value-objects/rol.vo';
import { EstadoCuenta } from '../value-objects/estado-cuenta.vo';
// aceptoComisionEn (Frente 3): fecha en que el usuario aceptó la comisión mínima del 5% sobre
// ventas -- se pide "una sola vez" en el perfil, en vez de repetirla en cada producto (ver
// PublicarProductoUseCase, que la exige/registra la primera vez que publica).
export interface UsuarioProps { id: string; nombre: string; correo: string; contraseñaHash: string; rol: Rol; idioma: string; nivelConocimiento: string; region: string; estado: EstadoCuenta; aceptoComisionEn?: Date | null; telefono?: string | null; biografia?: string | null; nombreNegocio?: string | null; }
export class Usuario { constructor(public readonly props: UsuarioProps) {} }
