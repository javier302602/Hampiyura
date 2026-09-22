import { Consulta } from '../../../entities/consulta.entity';
export interface ReabrirConsultaPort { ejecutar(id: string, solicitanteId: string, rolSolicitante: string): Promise<Consulta>; }
