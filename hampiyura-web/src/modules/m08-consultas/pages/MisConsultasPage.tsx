import { useEffect, useState } from 'react';
import { listarMisConsultas, ETIQUETAS_TIPO_CONSULTA, ETIQUETAS_ESTADO_CONSULTA, type Consulta } from '../api/consultas.api';
import IndicadorPrioridad from '../components/IndicadorPrioridad';

function MisConsultasPage({ onSeleccionar }: { onSeleccionar: (id: string) => void }) {
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listarMisConsultas().then(setConsultas).catch((err) => setError(err instanceof Error ? err.message : 'No se pudieron cargar tus consultas.')).finally(() => setCargando(false));
  }, []);

  if (cargando) return <p>Cargando tus consultas…</p>;
  if (error) return <p>{error}</p>;
  if (consultas.length === 0) return <p>Todavía no has enviado ninguna consulta.</p>;

  return (
    <div className="cards">
      {consultas.map((c) => (
        <article key={c.id} className="tarjeta-clicable" onClick={() => onSeleccionar(c.id)}>
          <strong>{ETIQUETAS_TIPO_CONSULTA[c.tipo]}</strong>
          <span className="badge badge-estado">{ETIQUETAS_ESTADO_CONSULTA[c.estado]}</span>
          <IndicadorPrioridad prioridad={c.prioridad} />
          <span>{c.descripcion}</span>
          <span className="comentario-meta">{new Date(c.fechaCreacion).toLocaleString()}</span>
        </article>
      ))}
    </div>
  );
}

export default MisConsultasPage;
