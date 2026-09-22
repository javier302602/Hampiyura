import { MensajeConsulta } from '../../entities/mensaje-consulta.entity';
export interface MensajeConsultaRepositoryPort {
  guardar(mensaje: MensajeConsulta): Promise<void>;
  listarPorConsulta(consultaId: string): Promise<MensajeConsulta[]>;
}
