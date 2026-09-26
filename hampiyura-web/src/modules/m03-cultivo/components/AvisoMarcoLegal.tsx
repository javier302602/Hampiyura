// Aviso legal GENERAL (uno solo, igual para todas las plantas; no lo edita nadie). Es información orientativa basada en las fuentes
// públicas citadas; no afirma nada de ninguna especie concreta. Lo específico de cada planta (categoría de conservación,
// autorización, conocimiento ancestral) lo completa un especialista en la sección "Marco legal y manejo responsable" de la guía.
const FUENTES = [
  { texto: 'Ley N° 27811 (texto)', url: 'https://www2.congreso.gob.pe/sicr/cendocbib/con3_uibd.nsf/BAC83DB14E7BC9FD052578B0006BD7FF/$FILE/27811.pdf' },
  { texto: 'Ley 27811, resumen', url: 'https://iuslatin.pe/ley-27811-ley-de-proteccion-de-los-conocimientos-colectivos-de-los-pueblos-indigenas-vinculados-a-los-recursos-biologicos/' },
  { texto: 'SERFOR: autorización para investigar o aprovechar flora silvestre fuera de áreas naturales protegidas', url: 'https://www.gob.pe/85797-autorizacion-para-investigar-flora-o-fauna-silvestre-fuera-de-areas-naturales-protegidas' },
  { texto: 'SERFOR: preguntas frecuentes', url: 'https://www.serfor.gob.pe/portal/administraciones-tecnica-forestales-y-de-fauna-silvestre-atffs/preguntas-frecuentes' },
  { texto: 'Reglamento de gestión forestal y de fauna silvestre en comunidades nativas y campesinas', url: 'https://sinia.minam.gob.pe/sites/default/files/siar-sanmartin/archivos/public/docs/reglamento-para-la-gestion-forestal-y-de-fauna-silvestre-en-comunidades-nativas-y-campesinas.pdf' },
];

function AvisoMarcoLegal() {
  return (
    <details className="aviso-marco-legal">
      <summary><span aria-hidden="true">ⓘ</span> Marco legal aplicable a cultivar y cosechar plantas nativas</summary>
      <div className="aviso-marco-legal-cuerpo">
        <ul>
          <li><strong>Flora silvestre nativa.</strong> En el Perú, cosechar o aprovechar plantas silvestres nativas puede requerir autorización de <strong>SERFOR</strong> (Ley Forestal y de Fauna Silvestre N° 29763 y su reglamento), según la especie y según el fin: no es lo mismo un uso personal que uno comercial. Algunas especies están categorizadas como amenazadas y tienen reglas especiales.</li>
          <li><strong>Conocimiento tradicional.</strong> El conocimiento colectivo de los pueblos indígenas sobre los usos de estas plantas está protegido por la <strong>Ley N° 27811</strong>. Si se usa con fines comerciales, se necesita el reconocimiento y el consentimiento de la comunidad de origen.</li>
          <li><strong>Esto es orientativo.</strong> No sustituye la asesoría legal ni el trámite ante la entidad competente, y HampiYura no da permisos. Lo que aplica a cada planta lo completa un especialista en la sección “Marco legal y manejo responsable” de su guía; si está vacía, aún no fue verificado.</li>
        </ul>
        <p className="comentario-meta">Fuentes:</p>
        <ul className="aviso-marco-legal-fuentes">
          {FUENTES.map((f) => <li key={f.url}><a href={f.url} target="_blank" rel="noopener noreferrer">{f.texto}</a></li>)}
        </ul>
      </div>
    </details>
  );
}

export default AvisoMarcoLegal;
