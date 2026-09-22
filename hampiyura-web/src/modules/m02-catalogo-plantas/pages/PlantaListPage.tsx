import { useEffect, useState } from 'react';
import { listarPlantas, type Planta } from '../api/plantas.api';
import { obtenerImagenPlanta } from '../components/imagen-planta';

function PlantaListPage({ onSeleccionar }: { onSeleccionar: (plantaId: string) => void }) {
  const [plantas, setPlantas] = useState<Planta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listarPlantas()
      .then(setPlantas)
      .catch(() => setError('No se pudo cargar el catálogo de plantas.'))
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return <p>Cargando catálogo…</p>;
  if (error) return <p>{error}</p>;
  if (plantas.length === 0) return <p>Todavía no hay plantas registradas en el catálogo.</p>;

  return (
    <section>
      <h2>Catálogo de plantas</h2>
      <div className="cards">
        {plantas.map((planta) => (
          <article key={planta.id} className="tarjeta-clicable" onClick={() => onSeleccionar(planta.id)}>
            {obtenerImagenPlanta(planta) && <img className="imagen-tarjeta-planta" src={obtenerImagenPlanta(planta)} alt={planta.nombreComun} loading="lazy" />}
            <strong>{planta.nombreComun}</strong>
            <span>{planta.nombreCientifico}</span>
            <span>{planta.familia}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

export default PlantaListPage;
