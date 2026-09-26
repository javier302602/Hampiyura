import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { categoriaDeRiesgo, ETIQUETA_CATEGORIA, type EvaluacionConservacion } from '../evaluacion-conservacion';

const anioTexto = (anio?: string) => (anio ? `, ${anio}` : ', año no indicado en la fuente de investigación');

// Estado de conservación de referencia en la ficha (Ronda 31): categoría IUCN + año, lista peruana (D.S. 043-2006-AG) y la fuente de cada dato.
// "No evaluada" se muestra literalmente (nunca vacío ni con un ícono que dé a entender que está bien). Con una contradicción sin resolver
// (Ojé) no se muestra ninguna categoría: solo el aviso de pendiente.
function EvaluacionConservacionBloque({ evaluacion }: { evaluacion?: EvaluacionConservacion | null }) {
  if (!evaluacion) return null;
  const riesgo = categoriaDeRiesgo(evaluacion);
  return (
    <section className={`evaluacion-conservacion${riesgo ? ' evaluacion-conservacion-riesgo' : ''}`} aria-label="Estado de conservación">
      <h3>{riesgo ? <AlertTriangle size={18} aria-hidden="true" /> : <ShieldCheck size={18} aria-hidden="true" />} Estado de conservación</h3>

      {evaluacion.pendiente ? (
        <p className="nota-cientifico">ℹ {evaluacion.pendiente}</p>
      ) : (
        <>
          {riesgo && <p className="advertencia-no-verificado">⚠ Especie con riesgo de conservación confirmado: <strong>{ETIQUETA_CATEGORIA[riesgo]}</strong>.</p>}
          <dl className="evaluacion-lista">
            {evaluacion.iucn && (
              <div>
                <dt>IUCN Red List (global)</dt>
                <dd>
                  <strong>{ETIQUETA_CATEGORIA[evaluacion.iucn.categoria]}</strong>{evaluacion.iucn.categoria !== 'NE' && ` (${evaluacion.iucn.categoria})`}{evaluacion.iucn.categoria !== 'NE' && anioTexto(evaluacion.iucn.anio)}
                  {evaluacion.iucn.aclaracion && <span className="evaluacion-aclaracion"> {evaluacion.iucn.aclaracion}</span>}
                  <span className="fuente-cita evaluacion-fuente">Fuente: {evaluacion.iucn.fuente}</span>
                </dd>
              </div>
            )}
            {evaluacion.peru && (
              <div>
                <dt>Perú · {evaluacion.peru.norma}</dt>
                <dd>
                  <strong>{evaluacion.peru.categoria === 'NF' ? 'No figura en la lista' : `${ETIQUETA_CATEGORIA[evaluacion.peru.categoria]} (${evaluacion.peru.categoria})`}</strong>{evaluacion.peru.anio && `, ${evaluacion.peru.anio}`}
                  {evaluacion.peru.aclaracion && <span className="evaluacion-aclaracion"> {evaluacion.peru.aclaracion}</span>}
                  <span className="fuente-cita evaluacion-fuente">Fuente: {evaluacion.peru.fuente}</span>
                </dd>
              </div>
            )}
          </dl>
          {evaluacion.avisoIdentidad && <p className="advertencia-no-verificado">⚠ {evaluacion.avisoIdentidad}</p>}
          <p className="comentario-meta">Investigación del equipo (Ronda 30). Pendiente de confirmar categoría por categoría directamente en iucnredlist.org y en los anexos completos del decreto.</p>
        </>
      )}
    </section>
  );
}

export default EvaluacionConservacionBloque;
