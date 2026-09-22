// RF-10: guarda una imagen y devuelve una ruta servible por la API (p. ej. /uploads/<archivo>).
// No existía antes de esta fase; ver el resumen de la sesión.
export interface AlmacenamientoMediaPort {
  guardar(nombreOriginal: string, contenidoBase64: string): Promise<string>;
}
