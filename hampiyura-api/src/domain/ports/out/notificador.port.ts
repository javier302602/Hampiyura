export interface ReferenciaNotificacion { entidadTipo: string; entidadId: string; }
export interface NotificadorPort { notificar(usuarioId:string, tipo:string, referencia?:ReferenciaNotificacion):Promise<void>; }
