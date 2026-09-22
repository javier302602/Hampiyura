import { randomUUID } from 'crypto';
import { mkdirSync, writeFileSync } from 'fs';
import { extname, join, basename } from 'path';
import { AlmacenamientoMediaPort } from '../../../../domain/ports/out/almacenamiento-media.port';
import { ValidationError } from '../../../../domain/errors/domain.errors';

const CARPETA_UPLOADS = join(process.cwd(), 'uploads');

export class LocalAlmacenamientoMediaAdapter implements AlmacenamientoMediaPort {
  async guardar(nombreOriginal: string, contenidoBase64: string): Promise<string> {
    const base64 = contenidoBase64.includes(',') ? contenidoBase64.slice(contenidoBase64.indexOf(',') + 1) : contenidoBase64;
    let buffer: Buffer;
    try { buffer = Buffer.from(base64, 'base64'); } catch { throw new ValidationError('El contenido de la imagen no es un base64 válido'); }
    if (buffer.length === 0) throw new ValidationError('El contenido de la imagen está vacío');
    mkdirSync(CARPETA_UPLOADS, { recursive: true });
    const extension = extname(basename(nombreOriginal)) || '.bin';
    const archivo = `${randomUUID()}${extension}`;
    writeFileSync(join(CARPETA_UPLOADS, archivo), buffer);
    return `/uploads/${archivo}`;
  }
}
