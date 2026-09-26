// Ronda 33/34 — Contenido de EJEMPLO para "Publicaciones de la comunidad" (M-06) y "Productos" (M-11).
// Fuente única: docs/plantas medicinales/HAMPIYURA_Contenido_Ejemplo_Publicaciones_Productos.md (textos tal cual). Es contenido de demostración:
// NO son testimonios ni ofertas reales. Todo se publica desde UNA cuenta dedicada (nunca desde una cuenta real del equipo), los títulos se ven limpios (Ronda 34: ya sin prefijo, para presentarlo), pero la autoría
// "Cuenta de ejemplo — HampiYura" y la aclaración de ejemplo de cada texto se CONSERVAN: nunca se hace pasar por una publicación u oferta real. Lo que el documento no dice (enfermedades tratadas, forma de preparación
// aparte, tipo de productor, zona, contacto...) queda VACÍO o "No especificado": no se rellena con otra cosa.

export const CUENTA_EJEMPLO = { correo: 'ejemplo@hampiyura.local', nombre: 'Cuenta de ejemplo — HampiYura', rol: 'Productor' } as const;
export const PREFIJO_EJEMPLO = '[Ejemplo] '; // prefijo de la versión anterior (Ronda 33): el cargador renombra lo ya cargado
export const conPrefijoAntiguo = (titulo: string) => PREFIJO_EJEMPLO + titulo;
export const NOTA_PRODUCTO = 'Producto de ejemplo para demostración — no representa una oferta de venta real ni un productor real.';
export const FUENTE_PUBLICACION = 'Contenido de ejemplo basado en la ficha de la planta en HampiYura (Kew POWO y los documentos de plantas medicinales del equipo). No es un testimonio personal.';

export interface PublicacionEjemplo { bin: string; titulo: string; contenido: string }
export interface ProductoEjemplo { bin: string; nombre: string; categoria: string; precio: string }

export const PUBLICACIONES_EJEMPLO: PublicacionEjemplo[] = [
  { bin: 'Bixa orellana', titulo: 'Achiote — infusión de hojas', contenido: 'En la Amazonía peruana, incluidas comunidades Asháninka, se prepara una infusión o cocimiento remojando las hojas de achiote en agua durante toda la noche. Esta publicación es un ejemplo de cómo se vería un aporte real de la comunidad — el dato de la preparación viene de la investigación ya citada en la ficha de la planta, no es un testimonio personal verificado.' },
  { bin: 'Morinda citrifolia', titulo: 'Noni — jugo fermentado', contenido: 'El jugo del fruto maduro de noni, fresco o fermentado, es una preparación de uso ancestral en el Pacífico y sudeste asiático que hoy también se cultiva comercialmente en la Amazonía peruana (Ucayali, San Martín, Loreto). Publicación de ejemplo — contenido basado en la investigación ya documentada en la plataforma.' },
  { bin: 'Croton lechleri', titulo: 'Sangre de grado — látex para heridas', contenido: 'El látex de sangre de grado se aplica directamente sobre heridas y picaduras, y también se toman unas gotas disueltas en agua por vía oral — uso documentado entre pueblos indígenas y población de la Amazonía occidental de Perú y Ecuador. Publicación de ejemplo, no un testimonio real.' },
  { bin: 'Uncaria tomentosa', titulo: 'Uña de gato — cocimiento de corteza', contenido: 'La corteza o raíz de uña de gato se prepara en cocimiento, o como extracto en alcohol. Tradicionalmente su uso estaba restringido a sacerdotes/curanderos del pueblo Asháninka en la Selva Central del Perú. Publicación de ejemplo — contenido de la investigación ya citada, no un testimonio personal.' },
  { bin: 'Plukenetia volubilis', titulo: 'Sacha inchi — semillas tostadas', contenido: 'Las semillas de sacha inchi se tuestan para comer directo, o se muelen para preparar una crema con aceite. Uso documentado entre los pueblos Mayoruna, Campa (Asháninka), Huitoto, Shipibo, Yagua y Bora. Publicación de ejemplo para mostrar la función de la plataforma.' },
  { bin: 'Myrciaria dubia', titulo: 'Camu camu — jugo de fruto', contenido: 'El jugo del fruto de camu camu, fresco o fermentado, se consume en zonas ribereñas de Perú, Brasil, Colombia, Ecuador y Venezuela, donde la planta crece naturalmente en las orillas de los ríos. Publicación de ejemplo, contenido basado en la ficha ya cargada de esta planta.' },
  { bin: 'Copaifera spp.', titulo: 'Copaiba — resina para la piel', contenido: 'La resina (oleorresina) de copaiba se aplica directamente sobre la piel o mucosas, y también se toman unas gotas en agua o miel por vía oral — uso documentado entre pueblos y población mestiza de la Amazonía peruana (Ucayali, Madre de Dios, Loreto). Publicación de ejemplo.' },
  { bin: 'Gentianella alborosea', titulo: 'Hercampuri — infusión para el hígado', contenido: 'El hercampuri se prepara en infusión de la planta seca. Ojo: es una especie altoandina, no amazónica de tierras bajas — en la selva se comercializa como insumo traído de la sierra, no se cultiva localmente. Publicación de ejemplo, con la misma aclaración que ya tiene la ficha de esta planta.' },
  { bin: 'Ilex guayusa', titulo: 'Guayusa — bebida ritual del amanecer', contenido: 'Las hojas de guayusa se hierven durante la noche, y la bebida se toma antes del amanecer como parte de un ritual tradicional de los pueblos jíbaros (Achuar, Shuar) y Kichwa de la Amazonía de Perú y Ecuador. Publicación de ejemplo.' },
];

export const PRODUCTOS_EJEMPLO: ProductoEjemplo[] = [
  { bin: 'Croton lechleri', nombre: 'Jabón artesanal de sangre de grado 100g', categoria: 'Cuidado de la piel', precio: 'S/ 14' },
  { bin: 'Copaifera spp.', nombre: 'Aceite de copaiba puro 30ml', categoria: 'Cuidado de la piel', precio: 'S/ 28' },
  { bin: 'Uncaria tomentosa', nombre: 'Cápsulas de uña de gato x100', categoria: 'Suplemento', precio: 'S/ 32' },
  { bin: 'Myrciaria dubia', nombre: 'Polvo liofilizado de camu camu 150g', categoria: 'Alimento/suplemento', precio: 'S/ 26' },
  { bin: 'Plukenetia volubilis', nombre: 'Aceite de sacha inchi prensado en frío 250ml', categoria: 'Alimento/aceite', precio: 'S/ 29' },
  { bin: 'Morinda citrifolia', nombre: 'Jugo de noni fermentado 500ml', categoria: 'Bebida/suplemento', precio: 'S/ 35' },
  { bin: 'Bixa orellana', nombre: 'Achiote molido 250g', categoria: 'Condimento/colorante', precio: 'S/ 9' },
  { bin: 'Gentianella alborosea', nombre: 'Cápsulas de hercampuri x100', categoria: 'Suplemento', precio: 'S/ 24' },
  { bin: 'Ilex guayusa', nombre: 'Té de guayusa en bolsitas (caja x20)', categoria: 'Infusión', precio: 'S/ 19' },
];

// Descripción del producto: la nota visible del documento + la categoría de ejemplo que trae la tabla (no es una categoría del catálogo de usos).
export const descripcionProducto = (p: ProductoEjemplo, credito?: string) => `${NOTA_PRODUCTO} Categoría de ejemplo: ${p.categoria}.${credito ? ` ${credito}` : ''}`;
// Las fotos son las de la ficha de cada planta (Wikimedia Commons / GBIF, con licencia libre): se acreditan junto al texto.
export const creditoFoto = (autor?: string | null, licencia?: string | null) => (autor ? `Foto de la planta: ${autor}${licencia ? ` · ${licencia}` : ''} (Wikimedia Commons).` : '');
