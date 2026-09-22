import { NotificadorPort } from '../../../../domain/ports/out/notificador.port';
export class ConsoleNotificador implements NotificadorPort { async notificar(_usuarioId:string,_tipo:string):Promise<void> {} }
