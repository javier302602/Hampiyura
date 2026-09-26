import { useEffect, useState } from 'react';
import { listarPlantas, type Planta } from '../api/plantas.api';
import { obtenerImagenPlanta } from '../components/imagen-planta';
import { etiquetaDeRiesgo } from '../../m10-conservacion/evaluacion-conservacion';
import PlantCard from '../../../shared/ui/PlantCard';
import SectionHeader from '../../../shared/ui/SectionHeader';
import LoadingState from '../../../shared/ui/LoadingState';
import ErrorState from '../../../shared/ui/ErrorState';
import EmptyState from '../../../shared/ui/EmptyState';

// Auditoría (frente 3, ronda anterior): esta pantalla seguía con las tarjetas densas originales
// (.tarjeta-clicable de 220px) mientras que Home ya usaba PlantCard (foto grande protagonista,
// card-grid con más aire) -- la identidad visual nunca se aplicó de verdad acá, que es justamente
// el catálogo/directorio que el pedido original mencionaba explícitamente. Ahora reusa el mismo
// PlantCard ya verificado en Home, en vez de mantener dos patrones de tarjeta de planta distintos.
function PlantaListPage({ onSeleccionar }: { onSeleccionar: (plantaId: string) => void }) {
  const [plantas, setPlantas] = useState<Planta[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listarPlantas()
      .then(setPlantas)
      .catch(() => setError('No se pudo cargar el catálogo de plantas.'));
  }, []);

  return (
    <section>
      <SectionHeader
        eyebrow="Catálogo"
        title="Explora las plantas"
        description="Especies amazónicas documentadas por la comunidad, con sus usos y estado de validación."
      />
      {plantas === null && !error && <LoadingState cards={6} label="Cargando catálogo de plantas" />}
      {error && <ErrorState description={error} />}
      {plantas && plantas.length === 0 && (
        <EmptyState title="Todavía no hay plantas registradas" description="El catálogo se está construyendo con la comunidad -- vuelve pronto o propón una planta." />
      )}
      {plantas && plantas.length > 0 && (
        <div className="card-grid">
          {plantas.map((planta) => (
            <PlantCard
              key={planta.id}
              nombreComun={planta.nombreComun}
              nombreCientifico={planta.nombreCientifico}
              familia={planta.familia}
              imagenUrl={obtenerImagenPlanta(planta)}
              etiquetaRiesgo={etiquetaDeRiesgo(planta)}
              onAbrir={() => onSeleccionar(planta.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default PlantaListPage;
