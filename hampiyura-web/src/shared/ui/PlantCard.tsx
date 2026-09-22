import { Leaf } from 'lucide-react';
import Card from './Card';

interface Props {
  nombreComun: string;
  nombreCientifico: string;
  familia?: string;
  imagenUrl?: string;
  onAbrir: () => void;
}

// Tarjeta de planta con foto como protagonista (RF de identidad visual) -- usada desde HomePage.
// El catálogo (PlantaListPage) se migra a esta misma tarjeta en su propia etapa; por ahora conviven
// dos implementaciones (la de PlantaListPage sigue igual, sin tocar).
function PlantCard({ nombreComun, nombreCientifico, familia, imagenUrl, onAbrir }: Props) {
  return (
    <Card interactive onClick={onAbrir}>
      <div className="plant-card-media">
        {imagenUrl ? (
          <img src={imagenUrl} alt={nombreComun} loading="lazy" />
        ) : (
          <div className="plant-card-media-empty"><Leaf size={32} aria-hidden="true" /></div>
        )}
      </div>
      <div className="card-ui-body">
        {familia && <span className="plant-card-eyebrow">{familia}</span>}
        <h3 className="plant-card-title">{nombreComun}</h3>
        <p className="plant-card-scientific">{nombreCientifico}</p>
      </div>
    </Card>
  );
}

export default PlantCard;
