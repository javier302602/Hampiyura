export interface RechazarContenidoPort { ejecutar(input:{validacionId:string; validadorId:string; rol:string; comentario:string}):Promise<void>; }
