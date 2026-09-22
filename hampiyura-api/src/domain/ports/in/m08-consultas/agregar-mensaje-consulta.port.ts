import { MensajeConsulta } from '../../../entities/mensaje-consulta.entity';

// RF-266: agrega un mensaje al hilo. Si lo escribe el equipo (rolAutor Administrador/Especialista_*
// con acceso a la consulta), el estado avanza (Pendiente->EnRevision->Respondida) y se notifica al
// autor (reusa el sistema de M-14, ver PersistenteNotificadorAdapter) -- solo si autorId existe.
export interface AgregarMensajeConsultaInput {
  consultaId: string;
  autorId: string;
  rolAutor: string;
  contenido: string;
}
export interface AgregarMensajeConsultaPort { ejecutar(input: AgregarMensajeConsultaInput): Promise<MensajeConsulta>; }
