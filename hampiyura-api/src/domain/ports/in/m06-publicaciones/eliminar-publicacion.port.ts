export interface EliminarPublicacionPort { ejecutar(id: string, solicitanteId: string, rol: string): Promise<void>; }
