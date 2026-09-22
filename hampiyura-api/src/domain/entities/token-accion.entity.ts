import { TipoTokenAccion } from '../value-objects/tipo-token-accion.vo';
export interface TokenAccionProps { id: string; usuarioId: string; tipo: TipoTokenAccion; token: string; expiracion: Date; usado: boolean; }
export class TokenAccion {
  constructor(public readonly props: TokenAccionProps) {}
  estaVigente(ahora: Date = new Date()): boolean { return !this.props.usado && this.props.expiracion > ahora; }
  marcarUsado() { this.props.usado = true; }
}
