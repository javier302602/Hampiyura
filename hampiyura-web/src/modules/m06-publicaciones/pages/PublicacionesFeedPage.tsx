import { useEffect, useState } from 'react';
import { listarPublicaciones, type Publicacion } from '../api/publicaciones.api';
import PublicacionCard from '../components/PublicacionCard';

function PublicacionesFeedPage({ onSeleccionar }: { onSeleccionar: (publicacionId: string) => void }) {
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listarPublicaciones()
      .then(setPublicaciones)
      .catch(() => setError('No se pudo cargar el feed de publicaciones.'))
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return <p>Cargando publicaciones…</p>;
  if (error) return <p>{error}</p>;

  return (
    <section>
      <h2>Publicaciones de la comunidad</h2>
      {publicaciones.length === 0 ? (
        <p>Todavía no hay publicaciones validadas para mostrar.</p>
      ) : (
        <div className="cards">
          {publicaciones.map((p) => <PublicacionCard key={p.id} publicacion={p} onAbrir={() => onSeleccionar(p.id)} />)}
        </div>
      )}
    </section>
  );
}

export default PublicacionesFeedPage;
