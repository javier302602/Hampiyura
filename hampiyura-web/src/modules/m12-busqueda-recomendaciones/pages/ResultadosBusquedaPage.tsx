import { useEffect, useState } from 'react';
import Button from '../../../shared/ui/Button';
import { buscarPlantas, type FiltrosBusqueda, type ResultadoBusquedaPlanta } from '../api/busqueda.api';
import { obtenerImagenPlanta } from '../../m02-catalogo-plantas/components/imagen-planta';

interface Props {
  filtros: FiltrosBusqueda;
  onSeleccionarPlanta: (plantaId: string) => void;
  onVolver: () => void;
}

function describirFiltros(filtros: FiltrosBusqueda): string[] {
  const partes: string[] = [];
  if (filtros.q?.trim()) partes.push(`nombre "${filtros.q.trim()}"`);
  if (filtros.enfermedad?.trim()) partes.push(`enfermedad "${filtros.enfermedad.trim()}"`);
  if (filtros.categoria?.trim()) partes.push(`categoría/propiedad "${filtros.categoria.trim()}"`);
  return partes;
}

function ResultadosBusquedaPage({ filtros, onSeleccionarPlanta, onVolver }: Props) {
  const [resultados, setResultados] = useState<ResultadoBusquedaPlanta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCargando(true);
    setError(null);
    buscarPlantas(filtros)
      .then(setResultados)
      .catch(() => setError('No se pudo completar la búsqueda.'))
      .finally(() => setCargando(false));
  }, [filtros]);

  const criterios = describirFiltros(filtros);

  return (
    <section>
      <Button variant="ghost" onClick={onVolver}>← Volver al catálogo</Button>
      <h2>Resultados de búsqueda</h2>
      {criterios.length > 0 && <p className="comentario-meta">Filtrando por {criterios.join(' + ')}.</p>}

      {cargando && <p>Buscando…</p>}
      {error && <p>{error}</p>}

      {!cargando && !error && resultados.length === 0 && (
        <div className="advertencia-no-verificado">
          ⚠ No se encontraron plantas que coincidan con {criterios.length > 0 ? criterios.join(' + ') : 'la búsqueda'}.
          {criterios.length > 1 && ' Intenta quitar alguno de los filtros para ampliar los resultados.'}
        </div>
      )}

      {!cargando && !error && resultados.length > 0 && (
        <div className="cards">
          {resultados.map((r) => (
            <article key={r.id} className="tarjeta-clicable" onClick={() => onSeleccionarPlanta(r.id)}>
              {obtenerImagenPlanta(r) && <img className="imagen-tarjeta-planta" src={obtenerImagenPlanta(r)} alt={r.nombreComun} loading="lazy" />}
              <strong>{r.nombreComun}</strong>
              <span><em>{r.nombreCientifico}</em></span>
              {r.descripcionBreve && <span>{r.descripcionBreve}</span>}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default ResultadosBusquedaPage;
