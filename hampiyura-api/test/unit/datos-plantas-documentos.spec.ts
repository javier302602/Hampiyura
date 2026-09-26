import { PLANTAS_DOCUMENTOS, SIN_DATO } from '../../scripts/datos-plantas-documentos';
import { TIPOS_PARTE } from '../../src/domain/value-objects/tipo-parte.vo';

// Los nombres del catálogo de usos (los mismos que siembra prisma/seed.ts).
const USOS = ['Digestivo', 'Respiratorio', 'Antiinflamatorio', 'Analgésico', 'Antipirético/Febrífugo', 'Antimicrobiano/Antibacteriano', 'Antifúngico', 'Antiparasitario', 'Antiviral', 'Cicatrizante', 'Dermatológico', 'Hepatoprotector', 'Cardiovascular', 'Diurético', 'Sedante/Relajante', 'Antioxidante', 'Inmunoestimulante', 'Ginecológico/Reproductivo', 'Urológico', 'Oftálmico', 'Odontológico', 'Veterinario', 'Cosmético', 'Alimenticio/Nutricional', 'Ritual/Espiritual', 'Otro'];
const todos = PLANTAS_DOCUMENTOS.flatMap((p) => p.usos.map((u) => ({ p, u })));

describe('Datos cargados desde los documentos del equipo (Ronda 28)', () => {
  test('son 27 plantas distintas, cada una con nombre científico único', () => {
    expect(PLANTAS_DOCUMENTOS.length).toBe(27);
    expect(new Set(PLANTAS_DOCUMENTOS.map((p) => p.nombreCientifico)).size).toBe(27);
  });
  test('todo uso apunta a una parte válida y a un uso del catálogo, con tipo Tradicional/Documentado/Científico y fuente citada', () => {
    for (const { p, u } of todos) {
      expect(TIPOS_PARTE as readonly string[]).toContain(u.parte);
      expect(USOS).toContain(u.uso);
      expect(['Tradicional', 'Documentado', 'Científico']).toContain(u.tipo);
      expect(u.fuente.trim().length).toBeGreaterThan(20);           // fuente citable (autores/revista/año o enlace)
      expect(u.motivo.trim().length).toBeGreaterThan(20);
      if (u.parte === 'Otra') expect(u.parteDetalle?.trim()).toBeTruthy(); // "Otra" exige decir cuál es
      expect(p.usos.length).toBeGreaterThan(0);
    }
  });
  test('no hay dos combinaciones idénticas (planta+parte+detalle+uso+tipo)', () => {
    const claves = todos.map(({ p, u }) => [p.nombreCientifico, u.parte, u.parteDetalle ?? '', u.uso, u.tipo].join('|'));
    expect(new Set(claves).size).toBe(claves.length);
  });
  test('todo Documentado guarda una nota INTERNA de lo que quedó sin confirmar; ningún otro tipo la necesita', () => {
    for (const { u } of todos) {
      if (u.tipo === 'Documentado') expect((u.notaInterna ?? '').length).toBeGreaterThan(20);
    }
    expect(todos.filter(({ u }) => u.tipo === 'Documentado').length).toBe(7);
  });
  test('lo Científico declara su nivel de evidencia (preclínico / humanos) y nunca se presenta como verificado', () => {
    for (const { u } of todos.filter(({ u }) => u.tipo === 'Científico')) expect(u.motivo).toMatch(/^Nivel de evidencia:/);
  });
  test('lo que los documentos no dicen queda como "no especificada"; no se infiere Tingo María ni ninguna zona', () => {
    for (const p of PLANTAS_DOCUMENTOS) {
      expect(p.habitat).toBe(SIN_DATO);
      expect(`${p.region} ${p.habitat}`).not.toMatch(/Tingo Mar[ií]a\.?$/); // la región solo cita lo que dice el documento
    }
    expect(PLANTAS_DOCUMENTOS.find((p) => p.nombreCientifico.startsWith('Genipa'))!.familia).toBe(SIN_DATO); // el documento no da la familia de Huito
    expect(PLANTAS_DOCUMENTOS.find((p) => p.nombreCientifico.startsWith('Coffea'))!.usos.some((u) => u.tipo === 'Tradicional')).toBe(false); // el café no es medicina tradicional según el documento
    expect(PLANTAS_DOCUMENTOS.find((p) => p.nombreCientifico.startsWith('Mansoa'))!.usos.some((u) => u.tipo === 'Tradicional')).toBe(false); // ajo sacha: sin etnobotánica verificable
  });
});
