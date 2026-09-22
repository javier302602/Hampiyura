import { TokenAccion } from '../../entities/token-accion.entity';
export interface TokenAccionRepositoryPort { guardar(token: TokenAccion): Promise<void>; buscarPorToken(token: string): Promise<TokenAccion | null>; }
