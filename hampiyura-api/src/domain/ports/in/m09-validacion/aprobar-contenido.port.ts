export interface AprobarContenidoPort { ejecutar(input:{validacionId:string; validadorId:string; rol:string}):Promise<void>; }
