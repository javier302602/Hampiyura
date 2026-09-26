// Datos de plantas medicinales tomados ÚNICAMENTE de los dos documentos del equipo (carpeta docs/plantas medicinales/):
//   - Plantas_Medicinales_Uso_Tradicional_1.docx     -> usos de tipo Tradicional
//   - Plantas_Medicinales_Respaldo_Cientifico_1.docx -> hallazgos de tipo Científico (o Documentado cuando el propio documento
//     admite que un dato no se pudo confirmar: cifras/dosis sin confirmar o autores del artículo sin confirmar).
// Regla: nada de conocimiento general. Si el documento no dice algo (familia, región, hábitat), queda como "No especificada...".
import { TipoParte } from '../src/domain/value-objects/tipo-parte.vo';

export interface EntradaUso {
  parte: TipoParte; parteDetalle?: string; uso: string; tipo: 'Tradicional' | 'Documentado' | 'Científico';
  motivo: string; fuente: string; contraindicaciones?: string;
  // Nota INTERNA (nunca pública): qué detalle quedó sin confirmar en el documento -> tarea de una ronda futura.
  notaInterna?: string;
}
export interface PlantaDoc { nombreComun: string; nombreCientifico: string; familia: string; region: string; habitat: string; usos: EntradaUso[] }

export const SIN_DATO = 'No especificada en los documentos fuente — pendiente de confirmar';
const usoDoc = (lugares: string) => `Uso documentado en: ${lugares}.`;

// ---- Citas reutilizadas (tal como aparecen en los documentos) ----
const IIAP = 'Mejía Carhuanca K, Rengifo Salgado EL. (2000). Plantas medicinales de uso popular en la Amazonía peruana. Lima: IIAP / AECI. ISBN 9972614005. https://repositorio.iiap.gob.pe/items/4fa81354-f7d3-4bc2-8efb-fca0d924966c';
const RENGIFO = 'Rengifo Salgado E. (2007). "Contribución de la etnomedicina — plantas medicinales a la salud de la población en la Amazonía." Instituto de Investigaciones de la Amazonía Peruana (IIAP), pp. 26-35.';
const LUZIATELLI = 'Luziatelli G, Sørensen M, Theilade I, Mølgaard P. (2010). Asháninka medicinal plants: a case study from the native community of Bajo Quimiriki, Junín, Peru. Journal of Ethnobiology and Ethnomedicine, 6, 21. https://doi.org/10.1186/1746-4269-6-21';
const MOGHADAMTOUSI = 'Moghadamtousi SZ, Fadaeinasab M, Nikzad S, Mohan G, Ali HM, Kadir HA. (2015). Annona muricata (Annonaceae): A Review of Its Traditional Uses, Isolated Acetogenins and Biological Activities. International Journal of Molecular Sciences, 16(7), 15625-15658. https://doi.org/10.3390/ijms160715625';
const VILAR = 'Vilar DA, et al. (2014). Traditional Uses, Chemical Constituents, and Biological Activities of Bixa orellana L.: A Review. The Scientific World Journal, 2014, 857292. https://doi.org/10.1155/2014/857292';
const MCKAY = 'McKay DL, Blumberg JB. (2006). A review of the bioactivity and potential health benefits of peppermint tea (Mentha piperita L.). Phytotherapy Research, 20(8), 619-633. https://doi.org/10.1002/ptr.1936';
const DHAKAD = 'Dhakad AK, Pandey VV, Beg S, Rawat JM, Singh A. (2018). Biological, medicinal and toxicological significance of Eucalyptus leaf essential oil: a review. Journal of the Science of Food and Agriculture, 2018. https://doi.org/10.1002/jsfa.8600';
const OLADEJI = 'Oladeji OS, Oluyori AP, Dada AO. (2022). Genus Morinda: An insight to its ethnopharmacology, phytochemistry, pharmacology and industrial applications. Arabian Journal of Chemistry, 15(9), 104024. https://doi.org/10.1016/j.arabjc.2022.104024';
const KEPLINGER = 'Keplinger K, Laus G, Wurm M, Dierich MP, Teppner H. (1999). Uncaria tomentosa (Willd.) DC. — ethnomedicinal use and new pharmacological, toxicological and botanical results. Journal of Ethnopharmacology, 64(1), 23-34. https://doi.org/10.1016/S0378-8741(98)00096-8';
const LOVERA = 'Lovera A, Bonilla C, Hidalgo J. (2006). Efecto neutralizador del extracto acuoso de Dracontium loretense (jergón sacha) sobre la actividad letal del veneno de Bothrops atrox. Revista Peruana de Medicina Experimental y Salud Pública, 23(3), 177-181. http://www.scielo.org.pe/scielo.php?script=sci_arttext&pid=S1726-46342006000300007';
const RODZI = 'Rodzi NARM, Lee LK. (2022). Sacha Inchi (Plukenetia volubilis L.): recent insight on phytochemistry, pharmacology, organoleptic, safety and toxicity perspectives. Heliyon, 8(9), e10572. https://doi.org/10.1016/j.heliyon.2022.e10572';
const HANSSON = 'Hansson A, Zelada JC, Noriega HP. (2005). Reevaluation of risks with the use of Ficus insipida latex as a traditional anthelmintic remedy in the Amazon. Journal of Ethnopharmacology, 98(3), 251-257. https://doi.org/10.1016/j.jep.2004.12.029';
const HASANUDIN = 'Hasanudin K, Hashim P, Mustafa S. (2012). Corn Silk (Stigma Maydis) in Healthcare: A Phytochemical and Pharmacological Review. Molecules, 17(8), 9697-9715. https://doi.org/10.3390/molecules17089697';
const PEREIRA = 'Pereira A, Maraschin M. (2015). Banana (Musa spp) from peel to pulp: ethnopharmacology, source of bioactive compounds and its relevance for human health. Journal of Ethnopharmacology, 160, 149-163. https://doi.org/10.1016/j.jep.2014.11.008';

const NOTA_AUTORES = 'Autores del artículo NO confirmados en el documento fuente (figura "Autores del artículo original").';

export const PLANTAS_DOCUMENTOS: PlantaDoc[] = [
  {
    nombreComun: 'Maíz (choclo)', nombreCientifico: 'Zea mays L.', familia: 'Poaceae',
    region: usoDoc('medicina tradicional china, pueblos nativos de Norteamérica, Turquía, Vietnam y Francia'), habitat: SIN_DATO,
    usos: [
      { parte: 'Otra', parteDetalle: 'Estigmas de la mazorca (pelo de choclo)', uso: 'Diurético', tipo: 'Tradicional',
        motivo: 'Problemas urinarios y renales: cistitis, edema (hinchazón), cálculos renales, incontinencia nocturna (enuresis). En China, para problemas de próstata. Pueblos nativos de Norteamérica: infecciones urinarias, malaria y problemas del corazón. Turquía y Vietnam: remedio diurético para afecciones urinarias y renales. Preparación: té o infusión de los estigmas secos.', fuente: HASANUDIN },
      { parte: 'Otra', parteDetalle: 'Estigmas de la mazorca (pelo de choclo)', uso: 'Diurético', tipo: 'Científico',
        motivo: 'Nivel de evidencia: preclínico (animales e in vitro); no hay ensayos clínicos sólidos en humanos. Efecto diurético y caliurético (más orina y potasio) comprobado en ratas; reducción de glucosa en ratones y ratas diabéticos; actividad antioxidante, antiinflamatoria y antifatiga en ratones; reducción de triglicéridos, colesterol total y LDL en ratas hiperlipidémicas; sin daño en tejidos de ratas con 8 % de estigma en la dieta durante 90 días.', fuente: HASANUDIN,
        contraindicaciones: 'Por su efecto diurético (demostrado en animales), usar con cuidado si se toman diuréticos o medicamentos para la presión.' },
      { parte: 'Semilla', parteDetalle: 'Grano del maíz morado (antocianinas)', uso: 'Antioxidante', tipo: 'Científico',
        motivo: 'Nivel de evidencia: preclínico. Revisión que reúne efectos antioxidantes, antiinflamatorios, antiobesidad, antidiabéticos y cardioprotectores de las antocianinas del maíz morado; los autores señalan que faltan ensayos clínicos en humanos.',
        fuente: 'Lao F, Sigurdson GT, Giusti MM. (2017). Health Benefits of Purple Corn (Zea mays L.) Phenolic Compounds. Comprehensive Reviews in Food Science and Food Safety, 16(2), 234-246. https://doi.org/10.1111/1541-4337.12249' },
    ],
  },
  {
    nombreComun: 'Café', nombreCientifico: 'Coffea arabica L.', familia: 'Rubiaceae', region: SIN_DATO, habitat: SIN_DATO,
    // El documento de uso tradicional dice que en las fuentes amazónicas revisadas el café es un cultivo comercial introducido, no una
    // planta medicinal tradicional: por eso NO se carga ningún uso Tradicional.
    usos: [
      { parte: 'Semilla', parteDetalle: 'Grano tostado, consumido como bebida', uso: 'Hepatoprotector', tipo: 'Científico',
        motivo: 'Nivel de evidencia: humanos, estudios observacionales (muestran asociación, no prueban causa-efecto). Revisión "paraguas" de 201 metaanálisis observacionales y 17 de intervención: el mayor beneficio se observó con 3 a 4 tazas al día; menor riesgo de muerte por todas las causas y por enfermedad cardiovascular; el beneficio más grande fue para enfermedades del hígado (cirrosis) y menor riesgo de cáncer de hígado, próstata, endometrio y piel (melanoma).',
        fuente: 'Poole R, Kennedy OJ, Roderick P, Fallowfield JA, Hayes PC, Parkes J. (2017). Coffee consumption and health: umbrella review of meta-analyses of multiple health outcomes. BMJ, 359, j5024. https://doi.org/10.1136/bmj.j5024',
        contraindicaciones: 'Los propios autores lo desaconsejan en el embarazo (bajo peso al nacer, parto prematuro, pérdida del embarazo) y en mujeres con riesgo de fracturas.' },
    ],
  },
  {
    nombreComun: 'Plátano (banano)', nombreCientifico: 'Musa spp.', familia: 'Musaceae',
    region: usoDoc('medicina tradicional de América, Asia, Oceanía, India y África'), habitat: SIN_DATO,
    usos: [
      { parte: 'Otra', parteDetalle: 'Cáscara', uso: 'Cicatrizante', tipo: 'Tradicional',
        motivo: 'La cáscara se aplica sobre la piel para ayudar a cicatrizar heridas, sobre todo quemaduras; también se ha usado para prevenir o aliviar la depresión y otras dolencias. Raíces, pseudotallos, tallos, hojas y flores se usan en medicina tradicional de América, Asia, Oceanía, India y África. Preparación: cáscara aplicada directamente (uso tópico); otras partes en preparados locales.', fuente: PEREIRA },
      { parte: 'Fruto', parteDetalle: 'Fruto verde (pulpa cocida)', uso: 'Digestivo', tipo: 'Científico',
        motivo: 'Nivel de evidencia: humanos, ensayo clínico controlado en 62 niños de 5 a 12 meses con diarrea persistente (Bangladesh): 250 g de plátano verde cocido por litro de dieta de arroz; recuperación al día 4 en 78 % con plátano verde vs 23 % en el control (p<0,001); redujo heces, suero oral, suero intravenoso y vómitos.',
        fuente: 'Rabbani GH, Teka T, Zaman B, Majid N, Khatun M, Fuchs GJ. (2001). Clinical studies in persistent diarrhea: dietary management with green banana or pectin in Bangladeshi children. Gastroenterology, 121(3), 554-560. https://doi.org/10.1053/gast.2001.27178',
        contraindicaciones: 'El efecto probado es del plátano VERDE cocido como parte de la dieta, no del plátano maduro.' },
    ],
  },
  {
    nombreComun: 'Cacao', nombreCientifico: 'Theobroma cacao L.', familia: 'Malvaceae',
    region: usoDoc('Amazonía peruana (cáscara de la semilla), México (Códice Florentino, 1590, y manuscrito Badiano, 1552), cultura maya (Códice de Princeton) y Europa colonial'), habitat: SIN_DATO,
    usos: [
      { parte: 'Semilla', parteDetalle: 'Cáscara de la semilla cocida', uso: 'Respiratorio', tipo: 'Tradicional',
        motivo: 'Amazonía peruana: la cáscara de la semilla cocida se usa para la tos seca. Preparación: cocimiento de la cáscara de la semilla.',
        fuente: `${IIAP}  ·  Dillinger TL, Barriga P, Escárcega S, Jiménez M, Salazar Lowe D, Grivetti LE. (2000). Food of the Gods: Cure for Humanity? A Cultural History of the Medicinal and Ritual Use of Chocolate. Journal of Nutrition, 130(8), 2057S-2072S. https://doi.org/10.1093/jn/130.8.2057S` },
      { parte: 'Semilla', parteDetalle: 'Semillas, flores, manteca y hojas (usos históricos)', uso: 'Otro', tipo: 'Tradicional',
        motivo: 'Códice Florentino (México, 1590): fiebre, falta de aire, males del estómago e intestino, diarrea infantil y tos con flema. Manuscrito Badiano (1552): las flores de cacao contra el cansancio. Códice de Princeton (maya): chocolate medicinal contra erupciones de piel, fiebre y convulsiones. Europa colonial (siglos XVI-XIX): más de 100 usos; para recuperar peso, estimular a personas decaídas y mejorar la digestión; la manteca de cacao se aplicaba en la piel y las hojas como antiséptico. Preparación: bebidas y pastas de cacao; manteca en uso externo.',
        fuente: 'Dillinger TL, Barriga P, Escárcega S, Jiménez M, Salazar Lowe D, Grivetti LE. (2000). Food of the Gods: Cure for Humanity? A Cultural History of the Medicinal and Ritual Use of Chocolate. Journal of Nutrition, 130(8), 2057S-2072S. https://doi.org/10.1093/jn/130.8.2057S' },
      { parte: 'Semilla', parteDetalle: 'Flavanoles del cacao (extracto o cacao en polvo)', uso: 'Cardiovascular', tipo: 'Científico',
        motivo: 'Nivel de evidencia: humanos, gran ensayo aleatorizado y revisión Cochrane. Ensayo COSMOS (21 442 adultos mayores, 3,6 años, 500 mg/día de flavanoles): eventos cardiovasculares totales -10 % (no estadísticamente significativo) y muerte por causa cardiovascular -27 % (HR 0,73; IC95 % 0,54-0,98), resultado secundario. Revisión Cochrane (35 ensayos, 1804 adultos): bajó la presión arterial en promedio 1,76 mmHg; en hipertensos, cerca de 4 mmHg sistólica.',
        fuente: 'Sesso HD, Manson JE, Aragaki AK, Rist PM, Johnson LG, et al. (2022). Effect of cocoa flavanol supplementation for the prevention of cardiovascular disease events: the COSMOS randomized clinical trial. American Journal of Clinical Nutrition, 115(6), 1490-1500. https://doi.org/10.1093/ajcn/nqac055  ·  Ried K, Fakler P, Stocks NP. (2017). Effect of cocoa on blood pressure. Cochrane Database of Systematic Reviews, CD008893. https://doi.org/10.1002/14651858.CD008893.pub3',
        contraindicaciones: 'El beneficio viene de los flavanoles; el chocolate comercial con mucha azúcar y grasa no equivale a estas dosis.' },
    ],
  },
  {
    nombreComun: 'Palta (aguacate)', nombreCientifico: 'Persea americana Mill.', familia: 'Lauraceae',
    region: usoDoc('Sudamérica, Centroamérica y África'), habitat: SIN_DATO,
    usos: [
      { parte: 'Hoja', uso: 'Otro', tipo: 'Tradicional',
        motivo: 'Hojas: incontinencia urinaria, nerviosismo, anemia, malaria, presión alta, diabetes; como sedante y antibacteriano. Preparación: infusión o cocimiento de hojas.',
        fuente: 'Gavídia-Valencia et al. (2024). Traditional use, phytoconstituents, and pharmacological effects of Persea americana: A recent review. Journal of Applied Biology & Biotechnology, 12(6). https://doi.org/10.7324/jabb.2024.190057' },
      { parte: 'Semilla', parteDetalle: 'Semilla (pepa)', uso: 'Odontológico', tipo: 'Tradicional',
        motivo: 'Semillas: dolor de muelas, enfermedades de la piel, colesterol alto y diabetes; antiinflamatorio. Preparación: extractos de la semilla.',
        fuente: 'Gavídia-Valencia et al. (2024). Traditional use, phytoconstituents, and pharmacological effects of Persea americana: A recent review. Journal of Applied Biology & Biotechnology, 12(6). https://doi.org/10.7324/jabb.2024.190057' },
      { parte: 'Fruto', uso: 'Dermatológico', tipo: 'Tradicional',
        motivo: 'Fruto: aplicado en la piel para granos y protección solar. Preparación: fruto en polvo o macerado sobre la piel.',
        fuente: 'Gavídia-Valencia et al. (2024). Traditional use, phytoconstituents, and pharmacological effects of Persea americana: A recent review. Journal of Applied Biology & Biotechnology, 12(6). https://doi.org/10.7324/jabb.2024.190057' },
      { parte: 'Corteza', parteDetalle: 'Corteza y tallo', uso: 'Otro', tipo: 'Tradicional',
        motivo: 'Corteza y tallo: malaria y dolor. Preparación: cocimiento de corteza.',
        fuente: 'Gavídia-Valencia et al. (2024). Traditional use, phytoconstituents, and pharmacological effects of Persea americana: A recent review. Journal of Applied Biology & Biotechnology, 12(6). https://doi.org/10.7324/jabb.2024.190057' },
      { parte: 'Fruto', parteDetalle: 'Pulpa del fruto', uso: 'Cardiovascular', tipo: 'Científico',
        motivo: 'Nivel de evidencia: humanos, ensayo controlado y gran estudio de cohorte. Ensayo cruzado en 45 adultos con sobrepeso u obesidad: con 1 palta al día el LDL bajó 13,5 mg/dL (las dietas sin palta bajaron 8,3 y 7,4). Cohorte de 68 780 mujeres y 41 700 hombres seguidos 30 años: 2 o más porciones por semana se asociaron con 16 % menos riesgo de enfermedad cardiovascular y 21 % menos de enfermedad coronaria.',
        fuente: 'Wang L, Bordi PL, Fleming JA, Hill AM, Kris-Etherton PM. (2015). Effect of a moderate fat diet with and without avocados on lipoprotein particle number, size and subclasses in overweight and obese adults: a randomized, controlled trial. Journal of the American Heart Association, 4(1), e001355. https://doi.org/10.1161/JAHA.114.001355  ·  Pacheco LS, Li Y, Rimm EB, Manson JE, Sun Q, Rexrode K, Hu FB, Guasch-Ferré M. (2022). Avocado Consumption and Risk of Cardiovascular Disease in US Adults. Journal of the American Heart Association, 11(7), e024014. https://doi.org/10.1161/JAHA.121.024014',
        contraindicaciones: 'La cohorte muestra asociación; el ensayo sí prueba efecto sobre el LDL a corto plazo.' },
    ],
  },
  {
    nombreComun: 'Guanábana (graviola)', nombreCientifico: 'Annona muricata L.', familia: 'Annonaceae',
    region: usoDoc('Amazonía peruana (población mestiza y nativa) y medicina tradicional de los trópicos de América, África y Asia'), habitat: SIN_DATO,
    usos: [
      { parte: 'Hoja', uso: 'Antiparasitario', tipo: 'Tradicional',
        motivo: 'Amazonía peruana: parasitosis intestinal y cólicos. Preparación: jugo obtenido de siete hojas frescas trituradas; infusiones y cocimientos de hojas o corteza.', fuente: `${IIAP}  ·  ${MOGHADAMTOUSI}`,
        contraindicaciones: 'El consumo prolongado de hojas y semillas se relaciona con neurotoxicidad (anonacina).' },
      { parte: 'Corteza', parteDetalle: 'Corteza (también semillas, raíz y fruto)', uso: 'Otro', tipo: 'Tradicional',
        motivo: 'En varios países tropicales: hojas, semillas, raíz, corteza y fruto se usan contra fiebre, parásitos, inflamación, diabetes, problemas del hígado y otras dolencias.', fuente: MOGHADAMTOUSI,
        contraindicaciones: 'El consumo prolongado de hojas y semillas se relaciona con neurotoxicidad (anonacina).' },
      { parte: 'Hoja', parteDetalle: 'Hojas, semillas, corteza, raíz y fruto (acetogeninas)', uso: 'Otro', tipo: 'Científico',
        motivo: 'Nivel de evidencia: solo preclínico (in vitro y animales); NO existen ensayos que prueben que cure el cáncer en humanos. Revisión de más de 100 acetogeninas: citotoxicidad en laboratorio en células de cáncer de pulmón (A549), mama (MCF-7), colon (HT-29), páncreas, próstata e hígado; actividades antiinflamatoria, antiparasitaria, antimalárica, antidiabética y hepatoprotectora en modelos de laboratorio y animales.',
        fuente: `${MOGHADAMTOUSI}  ·  Lannuzel A, Höglinger GU, Champy P, et al. (2008). Atypical parkinsonism in the Caribbean island of Guadeloupe: etiological role of the mitochondrial complex I inhibitor annonacin. Movement Disorders. https://doi.org/10.1002/mds.22300`,
        contraindicaciones: 'Riesgo neurotóxico con consumo prolongado de hojas/semillas (la anonacina es neurotóxica; se relacionó con un parkinsonismo atípico en Guadalupe). No abandonar tratamientos oncológicos por la guanábana.' },
    ],
  },
  {
    nombreComun: 'Achiote (urucum, annatto)', nombreCientifico: 'Bixa orellana L.', familia: 'Bixaceae',
    region: usoDoc('Amazonía peruana (incluidos los Asháninkas), pueblos indígenas de Brasil y otras regiones tropicales'), habitat: SIN_DATO,
    usos: [
      { parte: 'Hoja', uso: 'Dermatológico', tipo: 'Tradicional',
        motivo: 'Amazonía peruana (hojas): infecciones de la piel, antiséptico y cicatrizante vaginal, hepatitis y vómitos. Preparación: infusión, cocimiento o remojo de las hojas en agua durante la noche.', fuente: `${IIAP}  ·  ${LUZIATELLI}  ·  ${VILAR}` },
      { parte: 'Semilla', uso: 'Otro', tipo: 'Tradicional',
        motivo: 'Uso cultural (no medicinal): los Asháninkas usan las semillas para pintar el cuerpo y las flechas. Pueblos indígenas de Brasil y otras regiones tropicales: diversos usos medicinales.', fuente: `${LUZIATELLI}  ·  ${VILAR}` },
      { parte: 'Hoja', parteDetalle: 'Hojas (extracto acuoso)', uso: 'Antiinflamatorio', tipo: 'Científico',
        motivo: 'Nivel de evidencia: preclínico (animales); aún no hay ensayos clínicos en humanos. En ratas, el extracto acuoso de hojas secas (50 y 150 mg/kg durante 4 días) inhibió significativamente la inflamación por bradicinina y redujo la producción de óxido nítrico. Una revisión reúne actividades antimicrobiana, antioxidante y antiinflamatoria, mayormente en laboratorio y animales.',
        fuente: `Yoke Keong Y, Arifah AK, Sukardi S, Roslida AH, Somchit MN, Zuraini A. (2011). Bixa orellana leaves extract inhibits bradykinin-induced inflammation through suppression of nitric oxide production. Medical Principles and Practice, 20(2), 142-146. https://doi.org/10.1159/000319907  ·  Vilar DA, Vilar MSA, Moura TFAL, Raffin FN, Oliveira MR, Franco CFO, Athayde-Filho PF, Diniz MFFM, Barbosa-Filho JM. (2014). Traditional Uses, Chemical Constituents, and Biological Activities of Bixa orellana L.: A Review. The Scientific World Journal, 2014, 857292. https://doi.org/10.1155/2014/857292` },
    ],
  },
  {
    nombreComun: 'Menta (hierba buena)', nombreCientifico: 'Mentha × piperita L.', familia: 'Lamiaceae',
    region: usoDoc('medicina tradicional de Europa y de muchos otros países'), habitat: SIN_DATO,
    usos: [
      { parte: 'Hoja', uso: 'Digestivo', tipo: 'Tradicional',
        motivo: 'Uso tradicional muy antiguo para problemas digestivos: indigestión, gases, náuseas y cólicos; también para resfríos y dolor de cabeza. Preparación: infusión (té) de las hojas. (El documento cubre también M. spicata, "hierba buena".)', fuente: MCKAY },
      { parte: 'Hoja', parteDetalle: 'Aceite esencial de las hojas (mentol), en cápsulas con recubrimiento entérico', uso: 'Digestivo', tipo: 'Científico',
        motivo: 'Nivel de evidencia: humanos, metaanálisis de ensayos aleatorizados: 12 ensayos con 835 pacientes con síndrome de intestino irritable; mejora global de síntomas RR 2,39 (IC95 % 1,93-2,97) y del dolor abdominal RR 1,78 (IC95 % 1,43-2,20); efectos adversos 9,3 % vs 6,1 % con placebo (sin diferencia significativa). Sobre el té, hay pocos estudios clínicos.',
        fuente: `Alammar N, Wang L, Saberi B, Nanavati J, Holtmann G, Shinohara RT, Mullin GE. (2019). The impact of peppermint oil on the irritable bowel syndrome: a meta-analysis of the pooled clinical data. BMC Complementary and Alternative Medicine, 19, 21. https://doi.org/10.1186/s12906-018-2409-0  ·  ${MCKAY}`,
        contraindicaciones: 'Lo probado es el ACEITE en cápsulas con recubrimiento entérico. La "hierba buena" (Mentha spicata) es otra especie. Puede empeorar la acidez/reflujo.' },
    ],
  },
  {
    nombreComun: 'Eucalipto', nombreCientifico: 'Eucalyptus globulus Labill.', familia: 'Myrtaceae',
    region: usoDoc('medicina popular de muchos países; especie introducida, originaria de Australia'), habitat: SIN_DATO,
    usos: [
      { parte: 'Hoja', uso: 'Respiratorio', tipo: 'Tradicional',
        motivo: 'Afecciones respiratorias: resfríos, tos, gripe, congestión y sinusitis. Preparación: vapor de las hojas hervidas (inhalación) e infusión.', fuente: DHAKAD,
        contraindicaciones: 'El aceite esencial no debe tomarse; es tóxico, sobre todo en niños.' },
      { parte: 'Hoja', parteDetalle: 'Aceite esencial (1,8-cineol o eucaliptol), en cápsulas', uso: 'Respiratorio', tipo: 'Científico',
        motivo: 'Nivel de evidencia: humanos, ensayo aleatorizado doble ciego con 242 pacientes con EPOC (Alemania): 200 mg de cineol 3 veces al día durante 6 meses de invierno, además de su tratamiento normal; redujo la frecuencia, la duración y la gravedad de las crisis y mejoró la función pulmonar, la falta de aire y la calidad de vida; efectos adversos similares al placebo.',
        fuente: `Worth H, Schacher C, Dethlefsen U. (2009). Concomitant therapy with Cineole (Eucalyptole) reduces exacerbations in COPD: a placebo-controlled double-blind trial. Respiratory Research, 10, 69. https://doi.org/10.1186/1465-9921-10-69  ·  ${DHAKAD}`,
        contraindicaciones: 'El aceite esencial puro es TÓXICO si se ingiere, sobre todo en niños. El estudio usó cápsulas de cineol purificado.' },
    ],
  },
  {
    nombreComun: 'Noni', nombreCientifico: 'Morinda citrifolia L.', familia: 'Rubiaceae',
    region: usoDoc('Pacífico (Polinesia, Hawái) y sudeste asiático; en Perú es un cultivo comercial en la Amazonía (Ucayali, San Martín, Loreto)'), habitat: SIN_DATO,
    usos: [
      { parte: 'Fruto', parteDetalle: 'Fruto maduro (jugo) y hojas', uso: 'Otro', tipo: 'Tradicional',
        motivo: 'En el Pacífico (Polinesia, Hawái) y el sudeste asiático: dolores, problemas digestivos, infecciones, hipertensión y diabetes. En Taiwán, el jugo de fruto se usa para diabetes e hipertensión. En la Amazonía peruana es un cultivo relativamente reciente (introducido), promovido sobre todo como producto comercial más que como parte de la farmacopea ancestral documentada. Preparación: jugo del fruto maduro fermentado o fresco; infusión de hojas.', fuente: OLADEJI },
      { parte: 'Fruto', parteDetalle: 'Fruto maduro (jugo)', uso: 'Otro', tipo: 'Científico',
        motivo: 'Nivel de evidencia: humanos, estudios observacionales y de intervención recogidos en una revisión; además, varios casos clínicos reales de daño hepático asociado al consumo de jugo de noni. La revisión de estudios de intervención en humanos (West 2018) recoge sus posibles beneficios; la revisión etnofarmacológica del género (Oladeji 2022) documenta usos tradicionales del jugo para diabetes e hipertensión (Taiwán) y para dolor de cabeza, presión alta, diarrea y diabetes en islas del Pacífico.',
        fuente: `West BJ, Deng S, Isami F, Uwaya A, Jensen CJ. (2018). The Potential Health Benefits of Noni Juice: A Review of Human Intervention Studies. Foods, 7(4), 58. https://doi.org/10.3390/foods7040058  ·  ${OLADEJI}  ·  Casos de seguridad: Millonig G, et al. (2005). Herbal hepatotoxicity: acute hepatitis caused by a Noni preparation (Morinda citrifolia). European Journal of Gastroenterology & Hepatology. https://pubmed.ncbi.nlm.nih.gov/15756098/  ·  Stadlbauer V, et al. (2005). Hepatitis induced by Noni juice from Morinda citrifolia: a rare cause of hepatotoxicity or the tip of the iceberg? Digestion. https://pubmed.ncbi.nlm.nih.gov/16837801/  ·  Yu EW, et al. (2011). Acute Hepatotoxicity After Ingestion of Morinda citrifolia (Noni Berry) Juice in a 14-year-old Boy. Journal of Pediatric Gastroenterology and Nutrition. https://pubmed.ncbi.nlm.nih.gov/21119544/`,
        contraindicaciones: 'Existen múltiples casos clínicos publicados de hepatitis/daño hepático agudo asociados temporalmente al consumo de jugo de noni; la relación de causa-efecto es debatida (una carta científica cuestiona la atribución en uno de los casos), pero es una señal de seguridad real.' },
    ],
  },
  {
    nombreComun: 'Llantén (llantén mayor, llantén macho)', nombreCientifico: 'Plantago major L.', familia: 'Plantaginaceae',
    region: usoDoc('Perú y gran parte de América Latina (costa, sierra y selva), incluida la zona de Tingo María'), habitat: SIN_DATO,
    usos: [
      { parte: 'Hoja', parteDetalle: 'Hojas frescas o machacadas', uso: 'Cicatrizante', tipo: 'Tradicional',
        motivo: 'Cicatrizante de heridas y quemaduras; antiinflamatorio de la piel. Uso extendido en toda la medicina popular de Perú y Latinoamérica (costa, sierra y selva), incluida la zona de Tingo María, aplicado directamente sobre la piel. Preparación: hoja fresca machacada aplicada directamente (cataplasma); también en cocimiento para lavados.',
        fuente: 'Ministerio de Desarrollo Agrario y Riego del Perú (MIDAGRI). Ficha técnica: Llantén (Plantago major). https://www.midagri.gob.pe/portal/download/pdf/sectoragrario/agricola/lineasdecultivosemergentes/LLANTEN.pdf' },
      { parte: 'Hoja', parteDetalle: 'Hojas (extracto o crema)', uso: 'Cicatrizante', tipo: 'Documentado',
        motivo: 'Nivel de evidencia: humanos, varios ensayos clínicos aleatorizados sobre cicatrización de heridas y úlceras: ensayo abierto en pie diabético y úlceras por presión con extracto hidroalcohólico (Ghanadian 2024); estudio caso-control en quemaduras de segundo grado (Keshavarzi 2022); ensayo aleatorizado en úlceras por presión (Journal of Tissue Viability); y ensayo con crema de llantén contra placebo para prevenir radiodermatitis en cáncer de mama.',
        fuente: 'Ghanadian M, Soltani R, Homayouni A, Khorvash F, Mohammadi Jouabadi S, Abdollahzadeh M. (2024). The Effect of Plantago major Hydroalcoholic Extract on the Healing of Diabetic Foot and Pressure Ulcers: A Randomized Open-Label Controlled Clinical Trial. International Journal of Lower Extremity Wounds, 23, 475-481. https://doi.org/10.1177/15347346211070723  ·  Keshavarzi A, et al. (2022). Therapeutic Efficacy of Great Plantain (Plantago major L.) in the Treatment of Second-Degree Burn Wounds: A Case-Control Study. International Journal of Clinical Practice. https://doi.org/10.1155/2022/4923277  ·  Clinical and phytochemical studies of Plantago major in pressure ulcer treatment: A randomized controlled trial. Journal of Tissue Viability. https://www.sciencedirect.com/science/article/pii/S1744391121000244  ·  Efficacy of Plantago major leaf extract cream compared to placebo in preventing acute radiodermatitis in breast cancer patients: A randomized clinical trial. https://www.sciencedirect.com/science/article/pii/S1876382023000604',
        notaInterna: 'Ghanadian 2024: cifras exactas de mejoría NO confirmadas en el texto completo (documento científico). Los dos últimos estudios figuran como "(Autores del artículo original)": autores NO confirmados. Tarea futura: confirmar cifras y autores antes de subir a Científico.' },
    ],
  },
  {
    nombreComun: 'Sangre de grado (sangre de drago)', nombreCientifico: 'Croton lechleri Müll. Arg.', familia: 'Euphorbiaceae',
    region: usoDoc('pueblos indígenas y población de la Amazonía occidental (Perú, Ecuador)'), habitat: SIN_DATO,
    usos: [
      { parte: 'Otra', parteDetalle: 'Látex rojo de la corteza', uso: 'Cicatrizante', tipo: 'Tradicional',
        motivo: 'Heridas (cicatrizante), diarrea, úlceras del estómago, inflamación, picaduras de insectos e infecciones virales. Preparación: látex aplicado directamente sobre heridas y picaduras; unas gotas en agua por vía oral.',
        fuente: 'Jones K. (2003). Review of sangre de drago (Croton lechleri) — a South American tree sap in the treatment of diarrhea, inflammation, insect bites, viral infections, and wounds: traditional uses to clinical research. Journal of Alternative and Complementary Medicine, 9(6), 877-896. https://doi.org/10.1089/107555303771952235  ·  Memorial Sloan Kettering Cancer Center. About Herbs: Croton lechleri. https://www.mskcc.org/cancer-care/integrative-medicine/herbs/croton-lechleri' },
      { parte: 'Otra', parteDetalle: 'Látex (resina roja) de la corteza del tronco', uso: 'Digestivo', tipo: 'Científico',
        motivo: 'Nivel de evidencia: humanos, ensayo clínico y medicamento aprobado por la FDA (crofelemer). Ensayo aleatorizado doble ciego con 376 pacientes con VIH y diarrea no infecciosa (125 mg de crofelemer 2 veces al día): respondieron 17,6 % con crofelemer vs 8,0 % con placebo (p = 0,0096). La FDA aprobó el crofelemer (Mytesi) el 31 de diciembre de 2012, extraído del látex de esta planta.',
        fuente: 'MacArthur RD, Hawkins TN, Brown SJ, et al. (2013). Efficacy and safety of crofelemer for noninfectious diarrhea in HIV-seropositive individuals (ADVENT trial): a randomized, double-blind, placebo-controlled, two-stage study. HIV Clinical Trials, 14(6), 261-273. https://doi.org/10.1310/hct1406-261  ·  Resumen de la FDA: https://www.accessdata.fda.gov/drugsatfda_docs/nda/2012/202292Orig1s000SumR.pdf  ·  Memorial Sloan Kettering (ficha): https://www.mskcc.org/cancer-care/integrative-medicine/herbs/croton-lechleri',
        contraindicaciones: 'Para heridas y úlceras solo hay estudios en animales (según Memorial Sloan Kettering). Para herpes genital no fue mejor que placebo.' },
    ],
  },
  {
    nombreComun: 'Uña de gato (garabato)', nombreCientifico: 'Uncaria tomentosa (Willd.) DC.', familia: 'Rubiaceae',
    region: usoDoc('pueblo Asháninka (Selva Central del Perú)'), habitat: SIN_DATO,
    usos: [
      { parte: 'Corteza', parteDetalle: 'Corteza y raíz', uso: 'Otro', tipo: 'Tradicional',
        motivo: 'Los Asháninkas la usan como remedio que solo administran sus sacerdotes/curanderos, para trastornos que afectan el cuerpo, la mente o la "comunicación" entre ambos. En una comunidad Asháninka de Junín se registró un extracto alcohólico de uña de gato en el hogar. Preparación: cocimiento de corteza o raíz; extracto en alcohol. (El documento nombra también U. guianensis.)',
        fuente: `${KEPLINGER}  ·  ${LUZIATELLI}` },
      { parte: 'Corteza', parteDetalle: 'Corteza del tallo (liana) y raíz', uso: 'Antiinflamatorio', tipo: 'Científico',
        motivo: 'Nivel de evidencia: humanos, ensayo pequeño aleatorizado (estudio peruano) en 45 pacientes con artrosis de rodilla (30 uña de gato, 15 placebo), 4 semanas: redujo el dolor al realizar actividad y mejoró la evaluación médica y del paciente desde la 1.ª semana; no mejoró el dolor en reposo ni el nocturno; sin efectos adversos en sangre ni hígado. Una revisión describe alcaloides oxindólicos con efecto inmunomodulador y advierte que existen dos quimiotipos distintos de la planta.',
        fuente: `Piscoya J, Rodríguez Z, Bustamante SA, Okuhama NN, Miller MJS, Sandoval M. (2001). Efficacy and safety of freeze-dried cat's claw in osteoarthritis of the knee: mechanisms of action of the species Uncaria guianensis. Inflammation Research, 50(9), 442-448. https://doi.org/10.1007/PL00000268  ·  ${KEPLINGER}`,
        contraindicaciones: 'Evitar en embarazo y con inmunosupresores (efecto inmunomodulador).' },
    ],
  },
  {
    nombreComun: 'Chanca piedra', nombreCientifico: 'Phyllanthus niruri L.', familia: 'Phyllanthaceae',
    region: usoDoc('población de la Amazonía peruana'), habitat: SIN_DATO,
    usos: [
      { parte: 'Otra', parteDetalle: 'Raíz y planta entera', uso: 'Diurético', tipo: 'Tradicional',
        motivo: 'Hepatitis, infecciones urinarias y como diurético (para "chancar" o eliminar piedras del riñón). Preparación: cocimiento (decocción) o infusión.', fuente: IIAP },
      { parte: 'Otra', parteDetalle: 'Planta entera (partes aéreas), en cápsulas de extracto', uso: 'Urológico', tipo: 'Científico',
        motivo: 'Nivel de evidencia: humanos, ensayo aleatorizado con placebo en 69 pacientes con cálculos de calcio, 3 meses (450 mg 3 veces al día): en pacientes con calcio alto en orina lo redujo de 4,8 a 3,4 mg/kg/24 h (p<0,05); NO hubo diferencia en la expulsión de cálculos ni en el alivio del dolor frente a placebo.',
        fuente: 'Nishiura JL, Campos AH, Boim MA, Heilberg IP, Schor N. (2004). Phyllanthus niruri normalizes elevated urinary calcium levels in calcium stone forming (CSF) patients. Urological Research, 32, 362-366. https://doi.org/10.1007/s00240-004-0432-8',
        contraindicaciones: 'El efecto demostrado es metabólico (baja el calcio urinario), no que "rompa" piedras ya formadas.' },
    ],
  },
  {
    nombreComun: 'Chuchuhuasi', nombreCientifico: 'Maytenus macrocarpa (Ruiz & Pav.) Briq.', familia: 'Celastraceae',
    region: usoDoc('población de la Amazonía peruana'), habitat: SIN_DATO,
    usos: [
      { parte: 'Corteza', parteDetalle: 'Raíz y corteza', uso: 'Antiinflamatorio', tipo: 'Tradicional',
        motivo: 'Reumatismo, resfríos, bronquitis, diarrea y hemorroides. Preparación: maceración de la corteza en aguardiente (maceración alcohólica) y cocimiento.', fuente: IIAP },
      { parte: 'Hoja', parteDetalle: 'Hojas (extracto etanólico)', uso: 'Antiinflamatorio', tipo: 'Científico',
        motivo: 'Nivel de evidencia: preclínico (ratones), estudio peruano. Experimento doble ciego en 60 ratones BALB/c con extracto etanólico de hojas (500 a 1500 mg/kg): a 1250 mg/kg tuvo 74,14 % de efecto antiinflamatorio vs 58,62 % del diclofenaco; pero produjo efectos adversos neuroconductuales (excitación, marcha anormal, cólicos, piloerección). Tradicionalmente se usa la corteza; el estudio usó hojas.',
        fuente: 'Luján-Carpio E, Medina-Salazar H, Mayor-Vega A, Medrano-Canchari K, Mazuelos-Rivas M, Lizarraga-Castañeda Z, Pante-Medina C, Salazar-Granara A. (2019). Anti-Inflammatory and Neurobehavioral Effects of the Leaves from Maytenus macrocarpa (Ruiz and Pavon) Briquet in Mice. Pharmacognosy Journal, 11(1), 75-80. https://doi.org/10.5530/pj.2019.1.14',
        contraindicaciones: 'Otro estudio peruano en ratones (2022) reportó menor fertilidad y calidad espermática: http://www.scielo.org.pe/scielo.php?pid=S2308-05312022000400725&script=sci_arttext&tlng=en' },
    ],
  },
  {
    nombreComun: 'Huito (jagua, genipapo)', nombreCientifico: 'Genipa americana L.', familia: SIN_DATO,
    region: usoDoc('pueblos de la Amazonía peruana y brasileña'), habitat: SIN_DATO,
    usos: [
      { parte: 'Corteza', parteDetalle: 'Corteza, frutos, raíz y semillas', uso: 'Otro', tipo: 'Tradicional',
        motivo: 'Anemia, afecciones bronquiales, inflamación vaginal y hemorragias. Preparación: cocimiento, jugo del fruto y jarabe.', fuente: `${IIAP}  ·  Nascimiento et al. (2024). Genipa americana L.: A Review on Traditional Uses, Phytochemistry and Biological Activities. Chemistry & Biodiversity. https://doi.org/10.1002/cbdv.202400748` },
      { parte: 'Fruto', parteDetalle: 'Jugo del fruto verde', uso: 'Otro', tipo: 'Tradicional',
        motivo: 'Uso cultural (no medicinal): el jugo del fruto verde se usa como tinte negro-azulado para pintura corporal en muchos pueblos amazónicos.', fuente: IIAP },
    ],
  },
  {
    nombreComun: 'Jergón sacha', nombreCientifico: 'Dracontium loretense K. Krause', familia: 'Araceae',
    region: usoDoc('pueblos nativos de la Amazonía peruana'), habitat: SIN_DATO,
    usos: [
      { parte: 'Otra', parteDetalle: 'Bulbo (tubérculo)', uso: 'Otro', tipo: 'Tradicional',
        motivo: 'Antiofídico: "Los nativos peruanos usan como antiofídico el bulbo" de esta planta contra la mordedura de serpientes como el jergón. La fuente no detalla la forma de preparación.', fuente: LOVERA,
        contraindicaciones: 'No reemplaza al suero antiofídico.' },
      { parte: 'Otra', parteDetalle: 'Bulbo (tubérculo) seco', uso: 'Otro', tipo: 'Científico',
        motivo: 'Nivel de evidencia: preclínico (ratones), Instituto Nacional de Salud del Perú. Extracto de 15,2 g de bulbo seco en polvo hervido 5 min en 150 mL de agua: el veneno solo mató al 100 % de los ratones y el extracto solo no mató a ninguno; una dosis eficaz 50 de 91,15 µg de extracto por ratón neutralizó 2 dosis letales del veneno de Bothrops atrox (jergón).', fuente: LOVERA,
        contraindicaciones: 'NO reemplaza al suero antiofídico. Ante una mordedura, ir de inmediato al centro de salud.' },
    ],
  },
  {
    nombreComun: 'Sacha inchi (maní del inca)', nombreCientifico: 'Plukenetia volubilis L.', familia: 'Euphorbiaceae',
    region: usoDoc('pueblos Mayoruna, Campa (Asháninka), Huitoto, Shipibo, Yagua y Bora'), habitat: SIN_DATO,
    usos: [
      { parte: 'Semilla', uso: 'Analgésico', tipo: 'Tradicional',
        motivo: 'Semillas: remedio para problemas reumáticos y dolores musculares. Preparación: semillas tostadas.', fuente: RODZI },
      { parte: 'Semilla', parteDetalle: 'Semillas molidas con aceite (crema)', uso: 'Dermatológico', tipo: 'Tradicional',
        motivo: 'Semillas molidas mezcladas con aceite: crema para revitalizar y suavizar la piel. Semillas tostadas y hojas cocidas como alimento.', fuente: RODZI },
      { parte: 'Semilla', parteDetalle: 'Aceite de la semilla (rico en omega-3)', uso: 'Cardiovascular', tipo: 'Científico',
        motivo: 'Nivel de evidencia: humanos, ensayo pequeño peruano en 24 pacientes de 35 a 75 años con colesterol alto, 4 meses (5 mL o 10 mL de aceite al día): bajaron el colesterol total y los ácidos grasos libres y subió el HDL en ambos grupos; con 10 mL subió la insulina; los autores piden ensayos más grandes. Una revisión confirma en ensayos humanos mejoras en colesterol, triglicéridos y LDL.',
        fuente: `Garmendia F, Pando R, Ronceros G. (2011). Efecto del aceite de sacha inchi (Plukenetia volubilis L.) sobre el perfil lipídico en pacientes con hiperlipoproteinemia. Revista Peruana de Medicina Experimental y Salud Pública, 28(4), 628-632. http://www.scielo.org.pe/scielo.php?pid=S1726-46342011000400009&script=sci_abstract  ·  ${RODZI}`,
        contraindicaciones: 'No comer semillas crudas: tienen toxicidad (alcaloides, lectinas, saponinas) que se reduce al tostarlas.' },
    ],
  },
  {
    nombreComun: 'Camu camu', nombreCientifico: 'Myrciaria dubia (Kunth) McVaugh', familia: 'Myrtaceae',
    region: usoDoc('poblaciones de Perú, Brasil, Colombia, Ecuador y Venezuela'), habitat: SIN_DATO,
    usos: [
      { parte: 'Fruto', parteDetalle: 'Fruto (también hojas y semillas)', uso: 'Alimenticio/Nutricional', tipo: 'Tradicional',
        motivo: 'Poblaciones amazónicas han usado hojas, frutos y semillas; el jugo del fruto se toma también como bebida fermentada. Preparación: jugo del fruto, fresco o fermentado.',
        fuente: 'University of Texas at El Paso (UTEP) – Herbal Safety Program. Ficha de Camu-Camu. https://www.utep.edu/herbal-safety/hechos-herbarios/hojas-de-datos-a-base-de-hierbas/camu-camu.html' },
      { parte: 'Fruto', parteDetalle: 'Fruto (jugo)', uso: 'Antioxidante', tipo: 'Científico',
        motivo: 'Nivel de evidencia: humanos, ensayo pequeño (20 personas). Estudio aleatorizado en 20 hombres fumadores, 7 días: 70 mL diarios de jugo 100 % de camu camu (1050 mg de vitamina C) vs tabletas con la misma vitamina C; con camu camu bajaron marcadores de estrés oxidativo (8-OHdG, especies reactivas de oxígeno) e inflamación (PCR ultrasensible, IL-6, IL-8); con las tabletas de vitamina C no hubo cambios, por lo que el efecto se atribuye a otros compuestos del fruto.',
        fuente: 'Inoue T, Komoda H, Uchida T, Node K. (2008). Tropical fruit camu-camu (Myrciaria dubia) has anti-oxidative and anti-inflammatory properties. Journal of Cardiology, 52(2), 127-132. https://doi.org/10.1016/j.jjcc.2008.06.004',
        contraindicaciones: 'Seguridad en embarazo y lactancia no establecida.' },
    ],
  },
  {
    nombreComun: 'Mucura (mucuracaá, anamú)', nombreCientifico: 'Petiveria alliacea L.', familia: 'Phytolaccaceae',
    region: usoDoc('pueblos amazónicos y del Caribe; religiones afrobrasileñas'), habitat: SIN_DATO,
    usos: [
      { parte: 'Raíz', parteDetalle: 'Raíz y hojas', uso: 'Antiinflamatorio', tipo: 'Tradicional',
        motivo: 'Inflamación, dolor y convulsiones; también usos rituales y como calmante. Preparación: raíces, hojas o polvo de la planta.',
        fuente: 'Luz DA, et al. (2016). Ethnobotany, phytochemistry and neuropharmacological effects of Petiveria alliacea L. (Phytolaccaceae): A review. Journal of Ethnopharmacology, 185, 182-201. https://doi.org/10.1016/j.jep.2016.02.053',
        contraindicaciones: 'La misma revisión advierte toxicidad moderada a alta con uso crónico (mutagenicidad y genotoxicidad).' },
    ],
  },
  {
    nombreComun: 'Copaiba (copaíba, palo de aceite)', nombreCientifico: 'Copaifera spp. (C. paupera, C. reticulata, C. officinalis)', familia: 'Fabaceae',
    region: usoDoc('pueblos y población mestiza de la Amazonía peruana (Ucayali, Madre de Dios, Loreto)'), habitat: SIN_DATO,
    usos: [
      { parte: 'Otra', parteDetalle: 'Oleorresina (resina) extraída del tronco por incisión', uso: 'Cicatrizante', tipo: 'Tradicional',
        motivo: 'Heridas e inflamaciones, afecciones de garganta, úlceras y herpes; antiséptico de vías respiratorias y urinarias; acelera la cicatrización de mucosas. Preparación: resina aplicada directamente sobre la piel o mucosas; unas gotas por vía oral en agua o miel. En shipibo-conibo: "bonshish matisiati", "namboman tsacati".', fuente: RENGIFO },
      { parte: 'Otra', parteDetalle: 'Oleorresina / aceite esencial de copaiba', uso: 'Dermatológico', tipo: 'Científico',
        motivo: 'Nivel de evidencia: humanos, ensayo clínico pequeño (piel). Ensayo doble ciego controlado con placebo en 10 voluntarios con acné leve: gel al 1,0 % (p/p) de aceite esencial de copaiba (Copaifera langsdorffii) 2 veces al día durante 21 días; reducción altamente significativa del área afectada por acné (p < 0,001) frente al placebo.',
        fuente: 'Silva AG, Puziol PF, Leitão RN, et al. (2012). Application of the essential oil from copaiba (Copaifera langsdorffii Desf.) for acne vulgaris: a double-blind, placebo controlled clinical trial. Alternative Medicine Review, 17(1), 69-75. https://pubmed.ncbi.nlm.nih.gov/22417039/',
        contraindicaciones: 'Puede causar dermatitis de contacto en la piel (caso clínico reportado). Evitar uso interno sin orientación de un especialista. Existe una revisión de toxicología: Cardinelli CC, et al. (2023). Toxicological Effects of Copaiba Oil (Copaifera spp.) and Its Active Components. Plants, 12(5), 1054. https://doi.org/10.3390/plants12051054' },
      { parte: 'Otra', parteDetalle: 'Oleorresina / aceite de copaiba', uso: 'Antiinflamatorio', tipo: 'Documentado',
        motivo: 'Nivel de evidencia: preclínico (animales). Modelo animal en ratas con artritis inducida: efecto antiinflamatorio y antioxidante asociado a cambios en las células hepáticas.',
        fuente: 'Castro Ghizoni CV, Arssufi Ames AP, Lameira OA, et al. (2017). Anti-Inflammatory and Antioxidant Actions of Copaiba Oil Are Related to Liver Cell Modifications in Arthritic Rats. Journal of Cellular Biochemistry, 118(10), 3409-3423. https://doi.org/10.1002/jcb.25998',
        notaInterna: 'Dosis exacta y cifras estadísticas completas NO confirmadas en el texto completo; lista de autores más allá de los tres primeros NO confirmada (de ahí el "et al."). Revisar antes de citar un número preciso.' },
    ],
  },
  {
    nombreComun: 'Ojé (árbol doctor, higuerón)', nombreCientifico: 'Ficus insipida Willd.', familia: 'Moraceae',
    region: usoDoc('Pucallpa (Ucayali, Perú) y población de la Amazonía peruana en general'), habitat: SIN_DATO,
    usos: [
      { parte: 'Otra', parteDetalle: 'Látex (savia lechosa) del tronco', uso: 'Antiparasitario', tipo: 'Tradicional',
        motivo: 'Antiparasitario intestinal (antihelmíntico) tradicional, documentado específicamente en Pucallpa (Ucayali, Perú); también para dolor de muelas y leishmaniasis/uta. Preparación: látex tomado directamente por vía oral, en la dosis tradicional de aproximadamente 1 cm³ por kg de peso corporal.', fuente: `${RENGIFO}  ·  ${HANSSON}`,
        contraindicaciones: 'Riesgo documentado de toxicidad por sobredosis (ver el registro real de casos en el respaldo científico). No usar sin la dosis y supervisión de un especialista.' },
      { parte: 'Otra', parteDetalle: 'Látex del tronco', uso: 'Antiparasitario', tipo: 'Científico',
        motivo: 'Nivel de evidencia: humanos, estudio retrospectivo de SEGURIDAD (registros hospitalarios reales de Pucallpa, 1992-2003): 39 casos de toxicidad en 12 años, 37 hospitalizados, 1 muerte hospitalaria más 2 fuera del hospital; la mayoría de las reacciones graves ocurrieron con sobredosis (>1,5 cm³/kg); 5 casos de sensibilidad idiosincrática incluso a dosis "seguras", todos en niños. El efecto antiparasitario solo tiene evidencia preclínica: ensayo in vitro en parásitos de un pez amazónico (no en humanos), con 100 % de mortalidad a 1000 µL/L en 2 horas.',
        fuente: `${HANSSON}  ·  Gonzales APPF, Santos GG, Tavares-Dias M. (2019). Anthelminthic potential of the Ficus insipida latex on monogeneans of Colossoma macropomum (Serrasalmidae), a medicinal plant from the Amazon. Acta Parasitologica, 64(4), 927-931. https://doi.org/10.2478/s11686-019-00094-0`,
        contraindicaciones: 'Es la planta con el riesgo de toxicidad mejor documentado y cuantificado de los documentos: existe un registro real de muertes por sobredosis. No usar sin la dosis y supervisión de un especialista.' },
    ],
  },
  {
    nombreComun: 'Matico (hierba del soldado, cordoncillo)', nombreCientifico: 'Piper aduncum L.', familia: 'Piperaceae',
    region: usoDoc('población de la Amazonía peruana; nativa desde la costa hasta la selva'), habitat: SIN_DATO,
    usos: [
      { parte: 'Hoja', uso: 'Cicatrizante', tipo: 'Tradicional',
        motivo: 'Desinfección y cicatrización de heridas; antidiarreico; infecciones urinarias y respiratorias; antiséptico vaginal; úlceras; herpes; estreñimiento. Preparación: decocción de las hojas para lavado externo de heridas o como bebida; cataplasma de hojas machacadas. (El documento nombra también Piper elongatum Vahl.)',
        fuente: `Lock O, Rojas R. (2004). Química y farmacología del Piper aduncum L. ('matico'). Revista de Química (Pontificia Universidad Católica del Perú), 27, 27-31.  ·  ${RENGIFO}` },
      { parte: 'Hoja', parteDetalle: 'Hojas (extractos)', uso: 'Cicatrizante', tipo: 'Científico',
        motivo: 'Nivel de evidencia: humanos, estudio caso-control (cervicitis) y estudio in vitro con fibroblastos humanos; el resto, preclínico/in vitro. Extracto hidroalcohólico sobre fibroblastos humanos con validación en un modelo de herida en rata (IC50 = 200 µg/mL; una proteína aislada aumentó 8,6 veces la expresión de PDGF). Caso-control en 50 mujeres con cervicitis (gel de extracto etanólico de hojas): cervicitis aguda 29,4 % de mejoría vs 20,6 % en el control (p = 0,037); crónica 50 % vs 0 % (p = 0,007). Aceite esencial: actividad antiprotozoaria in vitro (Plasmodium falciparum, Trypanosoma) y contra Leishmania braziliensis, con citotoxicidad en células humanas MRC-5.',
        fuente: 'Paco K, Ponce-Soto LA, Lopez-Ilasaca M, Aguilar JL. (2016). Determinación del efecto cicatrizante del Piper aduncum (matico) sobre fibroblastos humanos. Revista Peruana de Medicina Experimental y Salud Pública, 33(3), 438-447. https://doi.org/10.17843/rpmesp.2016.333.2329  ·  Rodríguez-Lizana M, Ochoa-Yupanqui WW. (2020). Actividad biocida del extracto crudo etanólico del Piper elongatum "matico" en cervicitis en mujeres en edad fértil, como alternativa terapéutica. Journal of the Selva Andina Research Society, 11(1), 29-37.  ·  Monzote L, Scull R, Cos P, Setzer WN. (2017). Essential Oil from Piper aduncum: Chemical Analysis, Antimicrobial Assessment, and Literature Review. Medicines, 4(3), 49. https://doi.org/10.3390/medicines4030049  ·  Ceole LF, Cardoso MDG, Soares MJ. (2017). Nerolidol, the main constituent of Piper aduncum essential oil, has anti-Leishmania braziliensis activity. Parasitology, 144(9), 1179-1190. https://doi.org/10.1017/S0031182017000452' },
    ],
  },
  {
    nombreComun: 'Hercampuri', nombreCientifico: 'Gentianella alborosea (Gilg) Fabris', familia: 'Gentianaceae',
    region: usoDoc('medicina popular del norte del Perú; uso extendido en la sierra y en mercados de todo el país, incluida la selva alta'), habitat: SIN_DATO,
    usos: [
      { parte: 'Otra', parteDetalle: 'Partes aéreas secas', uso: 'Hepatoprotector', tipo: 'Tradicional',
        motivo: 'Problemas del hígado y de la vesícula, y en infusiones depurativas. Aviso de identidad del documento: la literatura y el comercio suelen mezclar tres especies emparentadas bajo el mismo nombre popular (Gentianella alborosea, G. nitida y G. bicolor, "corpus way"); la ficha de cada planta debe distinguirlas con cuidado. Preparación: infusión de la planta seca.',
        fuente: 'Rubio-Guevara S, Blanco-Olano C, Olascuaga-Castillo K, Valdiviezo-Campos JE. (2020). La etnobotánica y etnofarmacología de Gentianella alborosea (Gilg) Fabris y Gentianella nitida (Griseb.) Fabris (familia Gentianaceae) utilizadas en Perú: una revisión. Ethnobotany Research and Applications, 19, artículo 15, pp. 1-34. https://doi.org/10.32859/era.19.15.1-34' },
      { parte: 'Otra', parteDetalle: 'Partes aéreas secas', uso: 'Dermatológico', tipo: 'Tradicional',
        motivo: 'Medicina popular del norte del Perú para el tratamiento del acné (junto con canchalagua y corpus way).',
        fuente: 'Bussmann RW, Sharon D, Díaz D, Barocio Y. (2008). Las plantas peruanas «canchalagua» Schkuhria pinnata (Lam.) Kuntze, «hercampuri» Gentianella alborosea (Gilg.) Fabris y «corpus way» Gentianella bicolor (Wedd.) J. Pringle eficaces en el tratamiento del acné. Arnaldoa, 15(1), 149-152.' },
      { parte: 'Otra', parteDetalle: 'Partes aéreas secas (extracto acuoso)', uso: 'Hepatoprotector', tipo: 'Científico',
        motivo: 'Nivel de evidencia: preclínico (fitoquímica, aislamiento de compuestos; estudios hepatoprotectores en animales); no se encontraron ensayos clínicos en humanos verificables. Aviso de identidad: varios estudios corresponden a Gentianella nitida, especie emparentada pero distinta de G. alborosea; no asumir que un hallazgo en una especie aplica a la otra. En ratas con intoxicación por paracetamol, el extracto acuoso de G. nitida (200 mg/kg/día por 7 días) aumentó la superóxido dismutasa y redujo la lipoperoxidación (p<0,05). En un estudio con G. alborosea en hígado graso inducido por dieta, los propios autores no encontraron un efecto concluyente y recomendaron más estudios. Se aislaron compuestos (sesterterpenoides) en ambas especies, sin actividad biológica específica confirmada.',
        fuente: 'Carbonel Villanueva KN. (2017). Efecto hepatoprotector del extracto acuoso de Gentianella nitida en un modelo experimental inducido por paracetamol. Tesis de maestría, Universidad Nacional Mayor de San Marcos, Lima. https://docs.bvsalud.org/biblioref/2018/01/877347/efecto-hepatoprotector-del-extracto-acuoso-de-gentianella-nitid_1XfraPq.pdf  ·  Ugaz-Soto L, Zafra-Tanaka JH, Tapia Vicente ME. (2012). Efecto de Gentianella alborosea en esteatosis hepática no alcohólica inducida por dieta hiperlipídica en ratas Holtzman hembras. CIMEL, 17(1), 18-23. https://www.redalyc.org/pdf/717/71724868004.pdf  ·  Kawahara N, Nozawa M, Flores D, Bonilla P, Sekita S, Satake M, Kawai K. (1997). Nitidasin, a Novel Sesterterpenoid, from the Peruvian Folk Medicine "Hercampuri" (Gentianella nitida). Chemical & Pharmaceutical Bulletin, 45(10), 1717-1719.  ·  Kawahara N, Nozawa M, Flores D, Bonilla P, Sekita S, Satake M. (2000). Sesterterpenoid from Gentianella alborosea. Phytochemistry, 53(8), 881-884. https://pubmed.ncbi.nlm.nih.gov/10820797/' },
    ],
  },
  {
    nombreComun: 'Yacón (llacón)', nombreCientifico: 'Smallanthus sonchifolius (Poepp. & Endl.) H. Rob.', familia: 'Asteraceae',
    region: usoDoc('poblaciones andinas y amazónicas del Perú, Ecuador, Bolivia y Argentina'), habitat: SIN_DATO,
    usos: [
      { parte: 'Raíz', parteDetalle: 'Raíz tuberosa', uso: 'Alimenticio/Nutricional', tipo: 'Tradicional',
        motivo: 'La raíz se come como alimento dulce bajo en calorías. Preparación: raíz fresca o en jugo.',
        fuente: 'PromPerú. Uso histórico: Yacón — Smallanthus sonchifolius (Poepp.) H. Rob. Comisión de Promoción del Perú para la Exportación y el Turismo, repositorio institucional. https://repositorio.promperu.gob.pe/bitstreams/edd7499e-a79f-4951-9395-0275fdf82e07/download' },
      { parte: 'Hoja', uso: 'Otro', tipo: 'Tradicional',
        motivo: 'Las hojas se usan tradicionalmente en infusión para la diabetes en zonas andino-amazónicas del Perú.',
        fuente: 'PromPerú. Uso histórico: Yacón — Smallanthus sonchifolius (Poepp.) H. Rob. Comisión de Promoción del Perú para la Exportación y el Turismo, repositorio institucional. https://repositorio.promperu.gob.pe/bitstreams/edd7499e-a79f-4951-9395-0275fdf82e07/download' },
      { parte: 'Raíz', parteDetalle: 'Jarabe de la raíz (fructooligosacáridos, FOS)', uso: 'Otro', tipo: 'Científico',
        motivo: 'Nivel de evidencia: humanos, ensayo clínico aleatorizado, doble ciego, controlado con placebo (la evidencia humana más sólida entre las plantas del documento). 55 mujeres obesas con dislipidemia leve (35 completaron), 120 días, Argentina; 0,14 g de FOS por kg al día: peso 91,2 → 76,2 kg (placebo 90,7 → 92,3), cintura 105,1 → 95,2 cm, insulina en ayunas 12,6 → 7,3 mUI/mL, HOMA-IR 6,30 → 2,07 y LDL 3,54 → 2,52 mmol/L (p < 0,05 con yacón).',
        fuente: 'Genta S, Cabrera W, Habib N, Pons J, Carrillo IM, Grau A, Sánchez S. (2009). Yacon syrup: beneficial effects on obesity and insulin resistance in humans. Clinical Nutrition, 28(2), 182-187. https://doi.org/10.1016/j.clnu.2009.01.013',
        contraindicaciones: 'A dosis más altas de FOS produce molestias digestivas (gases, efecto laxante): la dosis mayor probada (0,29 g FOS/kg/día) se excluyó del análisis por esta razón; la frecuencia de defecación aumentó 3,5 veces en el grupo de yacón.' },
      { parte: 'Hoja', parteDetalle: 'Hojas (extracto acuoso)', uso: 'Hepatoprotector', tipo: 'Documentado',
        motivo: 'Nivel de evidencia: preclínico (modelo animal en ratas, Perú). Evaluó el efecto protector del extracto acuoso de yacón sobre el hígado en una intoxicación por acetaminofén.',
        fuente: 'Efecto hepatoprotector del extracto acuoso de Smallanthus sonchifolius (yacón) en un modelo de intoxicación con acetaminofén. Anales de la Facultad de Medicina (Universidad Nacional Mayor de San Marcos), 2012, 73(3). http://www.scielo.org.pe/scielo.php?script=sci_arttext&pid=S1025-55832012000300012',
        notaInterna: 'Dosis y cifras exactas NO confirmadas en el texto completo. Autores del artículo NO confirmados en el documento.' },
      { parte: 'Raíz', parteDetalle: 'Jarabe de la raíz', uso: 'Otro', tipo: 'Documentado',
        motivo: 'Revisión sistemática reciente (2025) de la evidencia clínica publicada en la última década sobre el jarabe de yacón.',
        fuente: 'Impacts of Yacon Syrup (Smallanthus sonchifolius) on Human Health: A Systematic Review of Scientific Evidence from the Last Decade. Nutrients, 17(5), 888 (2025). https://doi.org/10.3390/nu17050888',
        notaInterna: NOTA_AUTORES },
    ],
  },
  {
    nombreComun: 'Guayusa (huayusa)', nombreCientifico: 'Ilex guayusa Loes.', familia: 'Aquifoliaceae',
    region: usoDoc('pueblos jíbaros (Achuar, Shuar) de la frontera amazónica Perú-Ecuador y pueblo Kichwa'), habitat: SIN_DATO,
    usos: [
      { parte: 'Hoja', parteDetalle: 'Hojas tostadas o secas, en infusión', uso: 'Ritual/Espiritual', tipo: 'Tradicional',
        motivo: 'Bebida ritual y estimulante bebida antes del amanecer por los pueblos jíbaros (Achuar, Shuar) de la frontera amazónica Perú-Ecuador, asociada a rituales de "compartir sueños" y como emético/estimulante; también usada por el pueblo Kichwa. Preparación: hojas hervidas durante la noche, bebidas antes del amanecer.',
        fuente: 'Bennett BC. (1992). Ritualistic use of the holly Ilex guayusa by Amazonian Jivaro Indians. Journal of Ethnopharmacology, 35(2), 111-116. https://pubmed.ncbi.nlm.nih.gov/1682531/  ·  Dueñas JF, Jarrett C, Cummins I, Logan-Hines E. (2016). Amazonian Guayusa (Ilex guayusa Loes.): A Historical and Ethnobotanical Overview. Economic Botany, 70(1), 85-91. https://doi.org/10.1007/s12231-016-9334-2' },
      { parte: 'Hoja', parteDetalle: 'Hojas (extracto; contienen cafeína)', uso: 'Otro', tipo: 'Documentado',
        motivo: 'Nivel de evidencia: humanos, ensayo aleatorizado, cruzado, doble ciego, controlado con placebo en 25 adultos jóvenes. Con 600 mg de extracto (120 mg de cafeína): mejoras frente a placebo en el estado de ánimo, la fatiga, la energía percibida y la velocidad psicomotora; con 1200 mg: mejor desempeño motor-cognitivo pero nerviosismo reportado en mujeres; ambas dosis subieron la presión arterial entre 4 y 5 mmHg. Los autores concluyen que la dosis más baja parece optimizar los beneficios limitando efectos secundarios.',
        fuente: 'Acute, dose-response effects of guayusa leaf extract on mood, cognitive and motor-cognitive performance, and blood pressure, heart rate, and ventricular repolarization. Journal of the International Society of Sports Nutrition, 21(1) (2024). https://doi.org/10.1080/15502783.2024.2379424  ·  https://pubmed.ncbi.nlm.nih.gov/39014963/',
        contraindicaciones: 'Contiene cafeína: puede elevar la presión arterial (efecto confirmado en el ensayo) y no es recomendable en arritmias, embarazo o para quien deba evitar estimulantes.',
        notaInterna: NOTA_AUTORES },
    ],
  },
  {
    nombreComun: 'Ajo sacha', nombreCientifico: 'Mansoa alliacea (Lam.) A.H. Gentry', familia: 'Bignoniaceae', region: SIN_DATO, habitat: SIN_DATO,
    // Solo figura en el documento científico: el propio documento dice que no se encontró documentación etnobotánica primaria verificable
    // (comunidad y preparación) -> NO se carga ningún uso Tradicional.
    usos: [
      { parte: 'Hoja', parteDetalle: 'Hojas (extractos etanólico y acuoso)', uso: 'Analgésico', tipo: 'Científico',
        motivo: 'Nivel de evidencia: preclínico (animales/laboratorio). Estudio en 177 ratones Swiss Webster machos (pruebas de formalina y placa caliente), extractos de hojas a 30, 100, 300 y 600 mg/kg por vía intraperitoneal y oral: ambos extractos mostraron un efecto antinociceptivo superior al del diclofenaco en los dos modelos de dolor agudo; la vía intraperitoneal fue mejor que la oral; los mecanismos incluyen receptores opioides y la vía del óxido nítrico.',
        fuente: 'Valle-Dorado MG, Hernández-León A, Nani-Vázquez A, Ángeles-López GE, González-Trujano ME, Ventura-Martínez R. (2022). Antinociceptive effect of Mansoa alliacea polar extracts involves opioid receptors and nitric oxide in experimental nociception in mice. Biomedicine & Pharmacotherapy, 152, 113253. https://pubmed.ncbi.nlm.nih.gov/35696943/',
        contraindicaciones: 'No se encontraron datos de toxicidad/LD50 revisados por pares para esta planta: queda pendiente antes de recomendar cualquier dosis de uso.' },
      { parte: 'Hoja', parteDetalle: 'Hojas (extracto)', uso: 'Analgésico', tipo: 'Documentado',
        motivo: 'Nivel de evidencia: preclínico (ratones). Extracto de hojas con efecto antinociceptivo en un modelo de dolor inflamatorio crónico, mediado por mecanismos opioides. Además, un estudio de química/nanotecnología sintetizó nanopartículas de plata con extracto de hojas y caracterizó sus actividades biológicas (no es un ensayo terapéutico directo).',
        fuente: 'Mansoa alliacea extract presents antinociceptive effect in a chronic inflammatory pain model in mice through opioid mechanisms. Neurochemistry International (2018). https://www.sciencedirect.com/science/article/pii/S0197018618303668  ·  Phytosynthesis of Silver Nanoparticles Using Mansoa alliacea (Lam.) A.H. Gentry (Bignoniaceae) Leaf Extract: Characterization and Their Biological Activities. Pharmaceutics, 16(10), 1247 (2024). https://doi.org/10.3390/pharmaceutics16101247',
        notaInterna: NOTA_AUTORES + ' Aplica a los dos artículos citados.' },
      { parte: 'Raíz', parteDetalle: 'Raíces (extracto apolar)', uso: 'Otro', tipo: 'Documentado',
        motivo: 'Nivel de evidencia: preclínico (fitoquímica, Perú). Identificación de esteroles en el extracto apolar de raíces de ajo sacha cultivado o recolectado en Perú; no es un estudio de efecto terapéutico.',
        fuente: 'Esteroles presentes en el extracto apolar de las raíces de ajo sacha (Mansoa alliacea). Revista de la Sociedad Química del Perú, 84(4) (2018). http://www.scielo.org.pe/scielo.php?script=sci_arttext&pid=S1810-634X2018000400011',
        notaInterna: NOTA_AUTORES },
    ],
  },
];
