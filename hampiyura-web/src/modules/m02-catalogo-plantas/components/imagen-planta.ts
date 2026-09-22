import type { Planta } from '../api/plantas.api';

const FOTOS_POR_ESPECIE: Record<string, string> = {
  'Uncaria tomentosa': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Uncaria_tomentosa.jpg/800px-Uncaria_tomentosa.jpg',
  'Croton lechleri': 'https://upload.wikimedia.org/wikipedia/commons/2/2e/Sangre_de_grado_%28Croton_lechleri%29_en_el_jard%C3%ADn_bot%C3%A1nico_de_Takiwasi.jpg',
  'Maytenus macrocarpa': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Chuchuwasi_%28Monteverdia_macrocarpa%29%2C_vista_del_%C3%A1rbol_desde_abajo.jpg/960px-Chuchuwasi_%28Monteverdia_macrocarpa%29%2C_vista_del_%C3%A1rbol_desde_abajo.jpg',
};

// La imagen curada por la API siempre gana. El fallback solo cubre las especies amazónicas
// conocidas que ya tienen una fotografía libre identificada en Wikimedia Commons; no inventa
// imágenes para datos de prueba ni usa placeholders grises.
export function obtenerImagenPlanta(planta: Pick<Planta, 'nombreCientifico' | 'imagenPrincipal'>): string | undefined {
  return planta.imagenPrincipal || FOTOS_POR_ESPECIE[planta.nombreCientifico];
}
