import type { Preparacion } from '../api/preparaciones.api';

// RF-259: el aviso legal viaja siempre, con el mismo peso visual que el sello/advertencia de tipo
// de conocimiento en M-04/M-06 -- nunca como texto pequeño al pie.
// Un campo sin dato en la fuente se muestra como tal: nunca se rellena con una suposición (RF-252/RF-257).
const SIN_DATO = "No documentado en la fuente";
const valor = (t?: string) => (t && t.trim() ? t : SIN_DATO);

function PreparacionCard({ preparacion, avisoLegal }: { preparacion: Preparacion; avisoLegal: string }) {
  return (
    <article>
      <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
        <span className="badge badge-estado">{preparacion.estadoValidacion}</span>
      </div>
      <p className="aviso-legal">ℹ {avisoLegal}</p>
      <strong>Ingredientes</strong>
      <p style={{ margin: '.2em 0 .6em' }}>{valor(preparacion.ingredientes)}</p>
      <strong>Proceso paso a paso</strong>
      <p style={{ margin: '.2em 0 .6em', whiteSpace: 'pre-line' }}>{valor(preparacion.pasos)}</p>
      <strong>Herramientas / materiales</strong>
      <p style={{ margin: '.2em 0 .6em' }}>{valor(preparacion.herramientas)}</p>
      <span>Tiempo de preparación: {valor(preparacion.tiempoPreparacion)}</span>
      <strong>Forma tradicional de elaboración</strong>
      <p style={{ margin: '.2em 0 .6em' }}>{valor(preparacion.formaTradicionalElaboracion)}</p>
      <span>Conservación: {valor(preparacion.formaConservacion)}</span>
      {preparacion.advertencias?.trim() ? <p className="advertencia-no-verificado">⚠ {preparacion.advertencias}</p> : <span>Advertencias: {SIN_DATO}</span>}
      {preparacion.contraindicaciones && <span>Contraindicaciones: {preparacion.contraindicaciones}</span>}
      <span className="fuente-cita">Fuente: {preparacion.fuente.valor}</span>
      <span>Localidad: {preparacion.localidad}</span>
    </article>
  );
}

export default PreparacionCard;
