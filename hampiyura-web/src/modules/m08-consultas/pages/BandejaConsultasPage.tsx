import { useEffect, useState } from 'react';
import { listarBandejaConsultas, TIPOS_CONSULTA, ETIQUETAS_TIPO_CONSULTA, ESTADOS_CONSULTA, AREAS_ESPECIALIDAD, type Consulta, type FiltrosBandejaConsultas } from '../api/consultas.api';
import IndicadorPrioridad from '../components/IndicadorPrioridad';

// RF-264: filtrable por tipo/estado/área. Reusa el mismo criterio de "no actuar fuera de tu área"
// que M-09 (RN-05) -- el backend ya filtra según el rol de quien pregunta, esta pantalla solo
// muestra lo que la API decide devolver.
function BandejaConsultasPage({ onSeleccionar }: { onSeleccionar: (id: string) => void }) {
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<FiltrosBandejaConsultas>({});

  function cargar() {
    setCargando(true);
    setError(null);
    listarBandejaConsultas(filtros).then(setConsultas).catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar la bandeja de consultas.')).finally(() => setCargando(false));
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(cargar, [filtros.tipo, filtros.estado, filtros.area]);

  return (
    <section className="gestion-panel">
      <h2>Bandeja de consultas (M-08)</h2>
      <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <select value={filtros.tipo ?? ''} onChange={(e) => setFiltros((f) => ({ ...f, tipo: (e.target.value || undefined) as FiltrosBandejaConsultas['tipo'] }))}>
          <option value="">Todos los tipos</option>
          {TIPOS_CONSULTA.map((t) => <option key={t} value={t}>{ETIQUETAS_TIPO_CONSULTA[t]}</option>)}
        </select>
        <select value={filtros.estado ?? ''} onChange={(e) => setFiltros((f) => ({ ...f, estado: (e.target.value || undefined) as FiltrosBandejaConsultas['estado'] }))}>
          <option value="">Todos los estados</option>
          {ESTADOS_CONSULTA.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filtros.area ?? ''} onChange={(e) => setFiltros((f) => ({ ...f, area: (e.target.value || undefined) as FiltrosBandejaConsultas['area'] }))}>
          <option value="">Todas las áreas</option>
          {AREAS_ESPECIALIDAD.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {cargando && <p>Cargando bandeja de consultas…</p>}
      {error && <p>{error}</p>}
      {!cargando && !error && consultas.length === 0 && <p>No hay consultas que coincidan con el filtro.</p>}
      {!cargando && !error && consultas.length > 0 && (
        <div className="cards">
          {consultas.map((c) => (
            <article key={c.id} className="tarjeta-clicable" onClick={() => onSeleccionar(c.id)}>
              <strong>{ETIQUETAS_TIPO_CONSULTA[c.tipo]}</strong>
              <span className="badge badge-estado">{c.estado}</span>
              {c.areaAsignada && <span className="badge badge-estado">Área: {c.areaAsignada}</span>}
              <IndicadorPrioridad prioridad={c.prioridad} />
              <span>{c.descripcion}</span>
              <span className="comentario-meta">{c.autorId ? 'Con cuenta' : 'Visitante (sin cuenta)'} · {new Date(c.fechaCreacion).toLocaleString()}</span>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default BandejaConsultasPage;
