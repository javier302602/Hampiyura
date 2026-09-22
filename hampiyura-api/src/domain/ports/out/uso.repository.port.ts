import { Uso } from '../../entities/uso.entity';
export interface UsoRepositoryPort {
  guardar(uso: Uso): Promise<void>;
  listar(): Promise<Uso[]>;
  buscarPorId(id: string): Promise<Uso | null>;
  buscarPorNombre(nombre: string): Promise<Uso | null>;
}
