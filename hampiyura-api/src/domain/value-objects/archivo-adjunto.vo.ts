import { ValidationError } from '../errors/domain.errors';

// Criterio ÚNICO de qué archivos se pueden subir a la plataforma (fotos de publicaciones, productos, consultas,
// comprobantes de pago, documentos de evidencia científica...). Se valida en el SERVIDOR: el atributo `accept` de la
// pantalla es solo una ayuda y cualquiera puede saltárselo llamando directo a la API.
// Se admiten imágenes rasterizadas y PDF. NO se admite SVG (puede llevar scripts) ni HTML/JS/ejecutables, que
// servidos desde /uploads se ejecutarían en el mismo origen de la aplicación.
type Firma = (b: Buffer) => boolean;
const ascii = (b: Buffer, desde: number, texto: string) => b.length >= desde + texto.length && b.subarray(desde, desde + texto.length).toString('latin1') === texto;
const marcaFtyp = (b: Buffer, marcas: string[]) => ascii(b, 4, 'ftyp') && marcas.includes(b.subarray(8, 12).toString('latin1'));

const FIRMAS: Record<string, Firma> = {
  '.jpg': (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  '.jpeg': (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  '.png': (b) => b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  '.gif': (b) => ascii(b, 0, 'GIF87a') || ascii(b, 0, 'GIF89a'),
  '.webp': (b) => ascii(b, 0, 'RIFF') && ascii(b, 8, 'WEBP'),
  '.bmp': (b) => ascii(b, 0, 'BM'),
  '.avif': (b) => marcaFtyp(b, ['avif', 'avis']),
  '.heic': (b) => marcaFtyp(b, ['heic', 'heix', 'mif1', 'msf1']),
  '.heif': (b) => marcaFtyp(b, ['heic', 'heix', 'mif1', 'msf1']),
  '.pdf': (b) => ascii(b, 0, '%PDF-'),
};
export const EXTENSIONES_ADJUNTO_PERMITIDAS = Object.keys(FIRMAS);
export const MENSAJE_ADJUNTO_NO_PERMITIDO = 'Solo se admiten imágenes (JPG, PNG, GIF, WEBP, BMP, AVIF, HEIC) o documentos PDF.';

// Devuelve la extensión normalizada (minúsculas) si el archivo es de un tipo permitido Y su contenido real coincide con
// esa extensión (un .exe renombrado a .png no pasa). Si no, lanza ValidationError con un mensaje claro.
export function validarAdjunto(nombreOriginal: string, contenidoBase64: string): string {
  const nombre = (nombreOriginal ?? '').trim();
  const punto = nombre.lastIndexOf('.');
  const extension = punto >= 0 ? nombre.slice(punto).toLowerCase() : '';
  if (!extension || !(extension in FIRMAS)) {
    throw new ValidationError(`${MENSAJE_ADJUNTO_NO_PERMITIDO} Recibido: ${extension ? `"${extension}"` : 'un archivo sin extensión'}.`);
  }
  const base64 = contenidoBase64.includes(',') ? contenidoBase64.slice(contenidoBase64.indexOf(',') + 1) : contenidoBase64;
  const buffer = Buffer.from(base64, 'base64');
  if (buffer.length === 0) throw new ValidationError('El archivo está vacío');
  if (!FIRMAS[extension](buffer)) {
    throw new ValidationError(`El contenido del archivo no corresponde a su extensión "${extension}". ${MENSAJE_ADJUNTO_NO_PERMITIDO}`);
  }
  return extension;
}
