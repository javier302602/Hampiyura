// Vista de detalle de un ítem de la bandeja de validación: TODO lo que envió quien lo propuso, para
// poder decidir (aprobar / observar / rechazar) sin adivinar. `campos` es una lista genérica
// etiqueta→valor porque cada tipo de contenido tiene campos distintos.
export interface CampoDetalle { etiqueta: string; valor: string; }
export interface DetalleValidacion {
  id: string;
  tipoEntidad: string;
  estado: string;
  fecha: Date;
  autorNombre: string;
  etiqueta: string;
  campos: CampoDetalle[];
  imagenes: string[];
  ubicacion: { latitud: number; longitud: number } | null;
  // Contenido relacionado que se decide por separado (p. ej. la parte+uso propuesta junto con una planta).
  relacionados: { titulo: string; campos: CampoDetalle[] }[];
}
export interface ObtenerDetalleValidacionPort { ejecutar(validacionId: string): Promise<DetalleValidacion>; }
