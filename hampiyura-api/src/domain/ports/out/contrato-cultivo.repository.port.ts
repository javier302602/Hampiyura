import { ContratoCultivo } from '../../entities/contrato-cultivo.entity';

export interface ContratoCultivoRepositoryPort {
  guardar(c: ContratoCultivo): Promise<void>;
  actualizar(c: ContratoCultivo): Promise<void>;
  buscarPorId(id: string): Promise<ContratoCultivo | null>;
  listarDe(usuarioId: string, rol: 'comprador' | 'agricultor'): Promise<ContratoCultivo[]>;
}
