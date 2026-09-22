import { Rol } from '../value-objects/rol.vo';
import { EstadoCuenta } from '../value-objects/estado-cuenta.vo';
export interface UsuarioProps { id: string; nombre: string; correo: string; contraseñaHash: string; rol: Rol; idioma: string; nivelConocimiento: string; region: string; estado: EstadoCuenta; }
export class Usuario { constructor(public readonly props: UsuarioProps) {} }
