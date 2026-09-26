import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { listarReportes, resolverReporte, etiquetaCategoriaReporte, type EstadoReporte, type Reporte } from '../api/reportes.api';
import Button from '../../../shared/ui/Button';

type Filtro = EstadoReporte | 'Todos';
const FILTROS: { valor: Filtro; etiqueta: string }[] = [
  { valor: 'Pendiente', etiqueta: 'Pendientes' },
  { valor: 'Revisado', etiqueta: 'Revisados' },
  { valor: 'Desestimado', etiqueta: 'Desestimados' },
  { valor: 'Todos', etiqueta: 'Todos' },
];

// Mismo patrón que BandejaValidacionPage (M-09): gateada a validadores en App.tsx, tarjetas con
// acciones y el mensaje real del backend si una acción falla. Los reportes son distintos de las
// validaciones: son alertas sobre contenido YA publicado (hoy, comentarios), no aprobación de nuevo.
function BandejaReportesPage({ onVerPublicacion }: { onVerPublicacion: (publicacionId: string) => void }) {
  // Las tarjetas del panel llegan aquí con ?estado=Pendiente|Revisado|Desestimado ya aplicado.
  const [params] = useSearchParams();
  const inicial = params.get('estado');
  const [filtro, setFiltro] = useState<Filtro>(FILTROS.some((f) => f.valor === inicial) ? (inicial as Filtro) : 'Pendiente');
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accionError, setAccionError] = useState<string | null>(null);

  function cargar() {
    setCargando(true);
    setError(null);
    listarReportes(filtro === 'Todos' ? undefined : filtro)
      .then(setReportes)
      .catch(() => setError('No se pudo cargar la bandeja de reportes.'))
      .finally(() => setCargando(false));
  }
  useEffect(cargar, [filtro]);

  async function resolver(id: string, estado: 'Revisado' | 'Desestimado') {
    setAccionError(null);
    try { await resolverReporte(id, estado); cargar(); }
    catch (err) { setAccionError(err instanceof Error ? err.message : 'No se pudo resolver el reporte.'); }
  }

  return (
    <section className="gestion-panel">
      <h2>Bandeja de reportes</h2>
      <div role="group" aria-label="Filtrar por estado" style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        {FILTROS.map((f) => (
          <Button key={f.valor} size="sm" variant={filtro === f.valor ? 'primary' : 'secondary'} aria-pressed={filtro === f.valor} onClick={() => setFiltro(f.valor)}>
            {f.etiqueta}
          </Button>
        ))}
      </div>
      {accionError && <p className="error-formulario">{accionError}</p>}
      {cargando ? <p>Cargando reportes…</p> : error ? <p className="error-formulario">{error}</p> : reportes.length === 0 ? (
        <p>{filtro === 'Pendiente' ? 'No hay reportes pendientes de revisión.' : 'No hay reportes en este estado.'}</p>
      ) : (
        <div className="cards">
          {reportes.map((r) => (
            <article key={r.id} style={{ flex: "1 1 100%" }}>
              <span className="badge badge-estado">{r.tipoEntidad} · {r.estado}</span>
              <strong>{etiquetaCategoriaReporte(r.categoria)}</strong>
              {r.motivo ? <span>{r.motivo}</span> : <span className="comentario-meta">Sin descripción adicional.</span>}
              {r.contenido ? (
                <blockquote className="comentario-meta" style={{ margin: 0 }}>
                  “{r.contenido.texto}” — {r.contenido.autorNombre}
                </blockquote>
              ) : (
                <span className="comentario-meta">El contenido reportado ya no está disponible o no se puede mostrar aquí.</span>
              )}
              <span className="comentario-meta">Reportado por {r.reportadoPor} · {new Date(r.fecha).toLocaleString()}</span>
              <div style={{ display: 'flex', gap: '.5rem', marginTop: '.5rem', flexWrap: 'wrap' }}>
                {r.contenido && <Button size="sm" variant="ghost" onClick={() => onVerPublicacion(r.contenido!.publicacionId)}>Ver publicación</Button>}
                {r.estado === 'Pendiente' && (
                  <>
                    <Button size="sm" variant="primary" onClick={() => resolver(r.id, 'Revisado')}>Marcar revisado</Button>
                    <Button size="sm" variant="secondary" onClick={() => resolver(r.id, 'Desestimado')}>Desestimar</Button>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default BandejaReportesPage;
