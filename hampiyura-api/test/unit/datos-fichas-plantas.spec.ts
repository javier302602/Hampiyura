import { FICHAS_PLANTAS } from '../../scripts/datos-fichas-plantas';
import { PLANTAS_DOCUMENTOS } from '../../scripts/datos-plantas-documentos';

// Integridad de los datos de la Ronda 29 (fotos, hábitat, preparaciones). Regla RF-252/RF-257: solo lo que dice una fuente.
const binomial = (c: string) => c.replace(/\(.*?\)/g, '').split(/\s+/).filter((x) => x && x !== '×').slice(0, 2).join(' ');
const ficha = (bin: string) => FICHAS_PLANTAS.find((f) => f.bin === bin)!;

describe('fichas de plantas (Ronda 29)', () => {
  it('hay una ficha por cada una de las 27 plantas de la Ronda 28, sin repetir', () => {
    expect(FICHAS_PLANTAS).toHaveLength(27);
    expect(new Set(FICHAS_PLANTAS.map((f) => f.bin)).size).toBe(27);
    for (const p of PLANTAS_DOCUMENTOS) expect(FICHAS_PLANTAS.some((f) => f.bin === binomial(p.nombreCientifico))).toBe(true);
  });

  it('todas tienen hábitat con su fuente (Kew POWO) y foto con autor, licencia y página de origen', () => {
    for (const f of FICHAS_PLANTAS) {
      expect(f.habitat).toMatch(/Fuente: Kew POWO — https:\/\/powo\.science\.kew\.org\//);
      expect(f.foto).not.toBeNull();
      expect(f.foto!.url).toMatch(/^https:\/\//);
      expect(f.foto!.autor.trim()).not.toBe('');
      expect(f.foto!.licencia.trim()).not.toBe('');
      expect(f.foto!.fuenteUrl).toMatch(/^https:\/\//);
    }
  });

  it('cada preparación cuelga de una fila Parte+Uso Tradicional que existe y no se repite', () => {
    for (const f of FICHAS_PLANTAS) {
      const doc = PLANTAS_DOCUMENTOS.find((p) => binomial(p.nombreCientifico) === f.bin)!;
      const claves = new Set<string>();
      for (const pr of f.preparaciones) {
        const fila = doc.usos.find((u) => u.tipo === 'Tradicional' && u.parte === pr.parte && (u.parteDetalle ?? '') === (pr.parteDetalle ?? '') && u.uso === pr.uso);
        expect({ planta: f.bin, parte: pr.parte, encontrada: !!fila }).toEqual({ planta: f.bin, parte: pr.parte, encontrada: true });
        const clave = `${pr.parte}|${pr.parteDetalle ?? ''}|${pr.uso}`;
        expect(claves.has(clave)).toBe(false); claves.add(clave);
        expect(pr.formaTradicionalElaboracion.trim()).not.toBe('');
        expect(pr.localidad.trim()).not.toBe('');
      }
    }
  });

  it('Café y Ajo sacha no tienen preparación (sin uso tradicional; el protocolo de laboratorio no es una receta)', () => {
    expect(ficha('Coffea arabica').preparaciones).toHaveLength(0);
    expect(ficha('Mansoa alliacea').preparaciones).toHaveLength(0);
  });

  it('Jergón sacha: solo "se usa el bulbo", sin proceso paso a paso inventado', () => {
    const p = ficha('Dracontium loretense').preparaciones[0];
    expect(p.pasos).toBeUndefined();
    expect(p.formaTradicionalElaboracion).toMatch(/no detalla/);
  });

  it('Ojé lleva la advertencia de toxicidad/sobredosis', () => {
    expect(ficha('Ficus insipida').preparaciones[0].advertencias).toMatch(/sobredosis/i);
  });

  it('Hercampuri y Yacón dejan claro que son altoandinas y que en la selva se comercializan, no se cultivan', () => {
    expect(ficha('Gentianella alborosea').habitat).toMatch(/no es planta amaz[oó]nica.*no cultivado localmente/);
    expect(ficha('Smallanthus sonchifolius').habitat).toMatch(/altoandinos, no en selva baja.*no se cultiva localmente/);
  });

  it('ninguna foto tiene licencia no comercial (la plataforma monetiza): solo CC BY, CC BY-SA, CC0 o Arte Libre', () => {
    for (const f of FICHAS_PLANTAS) expect(f.foto!.licencia).not.toMatch(/NC|NonCommercial/);
    for (const f of FICHAS_PLANTAS) expect(f.foto!.licencia).toMatch(/CC BY|CC0|Arte Libre/);
  });

  it('ninguna preparación inventa campos: sin ingredientes/herramientas/tiempo/conservación en el dataset', () => {
    for (const f of FICHAS_PLANTAS) for (const pr of f.preparaciones) {
      expect(Object.keys(pr).sort().every((k) => ['parte', 'parteDetalle', 'uso', 'formaTradicionalElaboracion', 'pasos', 'advertencias', 'localidad'].includes(k))).toBe(true);
    }
  });
});
