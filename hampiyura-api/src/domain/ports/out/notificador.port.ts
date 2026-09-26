export interface ReferenciaNotificacion { entidadTipo: string; entidadId: string; /* texto propio (p. ej. alertas con el nombre de la planta); si falta se usa el genérico del tipo */ mensaje?: string; }
export interface NotificadorPort { notificar(usuarioId:string, tipo:string, referencia?:ReferenciaNotificacion):Promise<void>; }
