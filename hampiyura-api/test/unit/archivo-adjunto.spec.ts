import { validarAdjunto, EXTENSIONES_ADJUNTO_PERMITIDAS } from '../../src/domain/value-objects/archivo-adjunto.vo';
import { SubirMediaUseCase } from '../../src/application/m06-publicaciones/publicaciones.use-cases';

const b64 = (bytes: number[] | string) => Buffer.from(typeof bytes === 'string' ? Buffer.from(bytes, 'latin1') : Buffer.from(bytes)).toString('base64');
const PNG = b64([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const JPG = b64([0xff, 0xd8, 0xff, 0xe0, 0, 0x10]);
const PDF = b64('%PDF-1.7\n1 0 obj\n<<>>\nendobj\n');
const WEBP = b64('RIFF\x24\x00\x00\x00WEBPVP8 ');
const GIF = b64('GIF89a\x01\x00\x01\x00');
const HTML = b64('<html><script>alert(document.cookie)</script></html>');

describe('Validación de adjuntos en el SERVIDOR (imagen o PDF)', () => {
  test('acepta PDF e imágenes cuyo contenido real coincide con la extensión', () => {
    expect(validarAdjunto('estudio.pdf', PDF)).toBe('.pdf');
    expect(validarAdjunto('foto.PNG', PNG)).toBe('.png');
    expect(validarAdjunto('foto.jpg', JPG)).toBe('.jpg');
    expect(validarAdjunto('foto.jpeg', JPG)).toBe('.jpeg');
    expect(validarAdjunto('foto.webp', WEBP)).toBe('.webp');
    expect(validarAdjunto('anim.gif', GIF)).toBe('.gif');
    expect(validarAdjunto('desde-el-navegador.png', `data:image/png;base64,${PNG}`)).toBe('.png');
  });
  test.each(['pagina.html', 'script.js', 'programa.exe', 'dibujo.svg', 'macro.docm', 'archivo.bin', 'sin-extension', 'doble.png.html', 'trampa.php'])('rechaza "%s" con un mensaje claro', (nombre) => {
    expect(() => validarAdjunto(nombre, HTML)).toThrow(/Solo se admiten imágenes .* o documentos PDF/);
  });
  test('rechaza un archivo disfrazado: la extensión dice imagen pero el contenido es HTML/otro tipo', () => {
    expect(() => validarAdjunto('inocente.png', HTML)).toThrow(/no corresponde a su extensión/);
    expect(() => validarAdjunto('inocente.pdf', HTML)).toThrow(/no corresponde a su extensión/);
    expect(() => validarAdjunto('foto.jpg', PNG)).toThrow(/no corresponde/);
  });
  test('rechaza archivos vacíos y la lista de extensiones no incluye nada ejecutable ni SVG', () => {
    expect(() => validarAdjunto('vacio.png', '')).toThrow(/vacío/);
    for (const peligrosa of ['.svg', '.html', '.htm', '.js', '.exe', '.php', '.bin']) expect(EXTENSIONES_ADJUNTO_PERMITIDAS).not.toContain(peligrosa);
  });
});

describe('SubirMediaUseCase: el servidor rechaza aunque la pantalla no lo hubiera bloqueado', () => {
  test('una extensión no permitida NUNCA llega al almacenamiento', async () => {
    const almacenamiento: any = { guardar: jest.fn() };
    const uc = new SubirMediaUseCase(almacenamiento);
    await expect(uc.ejecutar({ nombreOriginal: 'pagina.html', contenidoBase64: HTML })).rejects.toThrow(/Solo se admiten imágenes/);
    await expect(uc.ejecutar({ nombreOriginal: 'evidencia.exe', contenidoBase64: PDF })).rejects.toThrow(/Solo se admiten imágenes/);
    await expect(uc.ejecutar({ nombreOriginal: 'disfrazado.png', contenidoBase64: HTML })).rejects.toThrow(/no corresponde/);
    expect(almacenamiento.guardar).not.toHaveBeenCalled();
  });
  test('un PDF y una imagen válidos sí se guardan', async () => {
    const almacenamiento: any = { guardar: jest.fn().mockResolvedValue('/uploads/x.pdf') };
    const uc = new SubirMediaUseCase(almacenamiento);
    await expect(uc.ejecutar({ nombreOriginal: 'estudio.pdf', contenidoBase64: PDF })).resolves.toEqual({ url: '/uploads/x.pdf' });
    await uc.ejecutar({ nombreOriginal: 'foto.png', contenidoBase64: PNG });
    expect(almacenamiento.guardar).toHaveBeenCalledTimes(2);
  });
});
