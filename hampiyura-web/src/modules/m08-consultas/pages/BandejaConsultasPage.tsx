import { useEffect, useState } from 'react';
import { listarBandejaConsultas, TIPOS_CONSULTA, ETIQUETAS_TIPO_CONSULTA, OPCIONES_FILTRO_ESTADO, ETIQUETAS_ESTADO_CONSULTA, esResuelta, AREAS_ESPECIALIDAD, type Consulta, type FiltrosBandejaConsultas, type EstadoConsulta } from '../api/consultas.api';
import IndicadorPrioridad from '../components/IndicadorPrioridad';

// RF-264: filtrable por tipo/estado/área. Reusa el mismo criterio de "no actuar fuera de tu área"
// que M-09 (RN-05) -- el backend ya filtra según el rol de quien pregunta, esta pantalla solo
// muestra lo que la API decide devolver.
function BandejaConsultasPage({ onSeleccionar }: { onSeleccionar: (id: string) => void }) {
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<FiltrosBandejaConsultas>({});
  // "Resuelta" agrupa Respondida y Cerrada (mismo significado al leerlo): se filtra aquí y no se manda al servidor.
  const [soloResueltas, setSoloResueltas] = useState(false);

  function cargar() {
    setCargando(true);
    setError(null);
    listarBandejaConsultas(filtros).then((l) => setConsultas(soloResueltas ? l.filter((c) => esResuelta(c.estado)) : l)).catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar la bandeja de consultas.')).finally(() => setCargando(false));
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(cargar, [filtros.tipo, filtros.estado, filtros.area, soloResueltas]);

  return (
    <section className="gestion-panel">
      <h2>Bandeja de consultas</h2>
      <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <select value={filtros.tipo ?? ''} onChange={(e) => setFiltros((f) => ({ ...f, tipo: (e.target.value || undefined) as FiltrosBandejaConsultas['tipo'] }))}>
          <option value="">Todos los tipos</option>
          {TIPOS_CONSULTA.map((t) => <option key={t} value={t}>{ETIQUETAS_TIPO_CONSULTA[t]}</option>)}
        </select>
        <select aria-label="Filtrar por estado" value={soloResueltas ? 'Resuelta' : filtros.estado ?? ''} onChange={(e) => { const v = e.target.value; setSoloResueltas(v === 'Resuelta'); setFiltros((f) => ({ ...f, estado: (v && v !== 'Resuelta' ? v : undefined) as EstadoConsulta | undefined })); }}>
          <option value="">Todos los estados</option>
          {OPCIONES_FILTRO_ESTADO.map((o) => <option key={o.valor} value={o.valor}>{o.etiqueta}</option>)}
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
              <span className="badge badge-estado">{ETIQUETAS_ESTADO_CONSULTA[c.estado]}</span>
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
