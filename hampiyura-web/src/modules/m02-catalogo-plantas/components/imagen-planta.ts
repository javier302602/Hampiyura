import type { Planta } from '../api/plantas.api';

const FOTOS_POR_ESPECIE: Record<string, string> = {
  // Bug real encontrado en auditoría (navegando la app real, no solo revisando código): la
  // variante thumb/ de este archivo devuelve 400 desde Wikimedia para cualquier ancho (falla de
  // generación de miniatura del lado de Wikimedia, no algo que dependa de este proyecto) --
  // verificado con curl y en el navegador (img.naturalWidth === 0). El archivo original (sin
  // /thumb/) sí carga bien (200, confirmado); se usa directo, igual que ya se hacía con la foto
  // de Sangre de grado más abajo.
  'Uncaria tomentosa': 'https://upload.wikimedia.org/wikipedia/commons/9/94/Uncaria_tomentosa.jpg',
  'Croton lechleri': 'https://upload.wikimedia.org/wikipedia/commons/2/2e/Sangre_de_grado_%28Croton_lechleri%29_en_el_jard%C3%ADn_bot%C3%A1nico_de_Takiwasi.jpg',
  'Maytenus macrocarpa': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Chuchuwasi_%28Monteverdia_macrocarpa%29%2C_vista_del_%C3%A1rbol_desde_abajo.jpg/960px-Chuchuwasi_%28Monteverdia_macrocarpa%29%2C_vista_del_%C3%A1rbol_desde_abajo.jpg',
};

// La imagen curada por la API siempre gana. El fallback solo cubre las especies amazónicas
// conocidas que ya tienen una fotografía libre identificada en Wikimedia Commons; no inventa
// imágenes para datos de prueba ni usa placeholders grises.
export function obtenerImagenPlanta(planta: Pick<Planta, 'nombreCientifico' | 'imagenPrincipal'>): string | undefined {
  return planta.imagenPrincipal || FOTOS_POR_ESPECIE[planta.nombreCientifico];
}
