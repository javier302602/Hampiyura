import { Notificacion } from '../../../entities/notificacion.entity';
export interface ListarNotificacionesPort { ejecutar(usuarioId: string): Promise<Notificacion[]>; }
