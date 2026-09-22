// `entidadTipo`/`entidadId`: referencia opcional a la entidad de origen -- mismo patrón ya usado en
// ValidacionContenido (M-09). No todos los tipos de notificación la tienen (los ya existentes de
// M-06/M-07/M-09 se generaron antes de que hiciera falta y no se retroalimentan retroactivamente
// en esta ronda); los nuevos de M-08 (consulta_en_revision/consulta_respondida) sí la traen, para
// poder navegar directo a la consulta en vez de solo mostrar un mensaje genérico.
export interface NotificacionProps { id:string; usuarioId:string; tipo:string; mensaje:string; leida:boolean; fecha:Date; entidadTipo?:string; entidadId?:string; }
export class Notificacion { constructor(public readonly props: NotificacionProps) {} }
