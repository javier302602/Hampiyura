import { Valoracion } from '../../entities/valoracion.entity';
export interface ValoracionRepositoryPort {
  guardar(valoracion: Valoracion): Promise<void>;
  actualizar(valoracion: Valoracion): Promise<void>;
  buscarPorAutorYPublicacion(autorId: string, publicacionId: string): Promise<Valoracion | null>;
  listarPorPublicacion(publicacionId: string): Promise<Valoracion[]>;
}
