// RF-274: permite al frontend saber ANTES de publicar si el texto activaría revisión reforzada,
// reusando exactamente la misma detección que PublicarProductoUseCase (contieneAfirmacionEnganosa)
// en vez de duplicar la lista de términos/heurística en el cliente.
export interface VerificarAfirmacionesInput { nombre?: string; descripcion?: string; informacionProceso?: string; ingredientes?: string; modoDeUso?: string; }
export interface VerificarAfirmacionesPort { ejecutar(input: VerificarAfirmacionesInput): Promise<{ requiereRevisionReforzada: boolean }>; }
