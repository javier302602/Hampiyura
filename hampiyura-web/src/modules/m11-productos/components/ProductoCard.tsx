import { Leaf } from 'lucide-react';
import type { ProductoVisible } from '../api/productos.api';
import Card from '../../../shared/ui/Card';

// Reusa el mismo patrón de PlantCard (m02-catalogo-plantas) -- foto grande como protagonista,
// mismo tratamiento de "sin foto" (ícono de hoja, no un recuadro roto) -- en vez de escribir un
// estilo nuevo. Las clases plant-card-* son genéricas (definidas en card.css junto a Card), no
// específicas de plantas; reusarlas tal cual evita duplicar CSS para el mismo patrón visual.
function ProductoCard({ producto, onAbrir }: { producto: ProductoVisible; onAbrir: () => void }) {
  const foto = producto.fotografias[0];
  return (
    <Card interactive onClick={onAbrir}>
      <div className="plant-card-media">
        {foto ? (
          <img src={foto} alt={producto.nombre} loading="lazy" />
        ) : (
          <div className="plant-card-media-empty"><Leaf size={32} aria-hidden="true" /></div>
        )}
      </div>
      <div className="card-ui-body">
        <span className="plant-card-eyebrow">{producto.localidad}</span>
        <h3 className="plant-card-title">{producto.nombre}</h3>
        <p className="plant-card-scientific">Por {producto.productorNombre}</p>
        {producto.plantasNombres.length > 0 && (
          <p style={{ margin: 0, fontSize: 'var(--font-size-small)', color: 'var(--color-text-muted)' }}>
            {producto.plantasNombres.join(', ')}
          </p>
        )}
        {producto.precioReferencial && (
          <p style={{ margin: 0, fontWeight: 'var(--font-weight-bold)', color: 'var(--color-accent-hover)' }}>
            {producto.precioReferencial}
          </p>
        )}
      </div>
    </Card>
  );
}

export default ProductoCard;
