import { Consulta } from '../../../entities/consulta.entity';
import { MensajeConsulta } from '../../../entities/mensaje-consulta.entity';

export interface ConsultaConHilo { consulta: Consulta; mensajes: MensajeConsulta[]; }

// RF-266: detalle + hilo completo. Control de acceso: solo el autor, o un admin/especialista con
// acceso a su área (o a una consulta sin área asignada), pueden verla.
export interface ObtenerConsultaPort { ejecutar(id: string, solicitanteId: string, rolSolicitante: string): Promise<ConsultaConHilo>; }
