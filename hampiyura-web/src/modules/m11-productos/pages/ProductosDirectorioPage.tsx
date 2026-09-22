import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { listarProductos, type ProductoVisible } from '../api/productos.api';
import { listarPlantas, type Planta } from '../../m02-catalogo-plantas/api/plantas.api';
import ProductoCard from '../components/ProductoCard';
import Button from '../../../shared/ui/Button';
import SectionHeader from '../../../shared/ui/SectionHeader';
import LoadingState from '../../../shared/ui/LoadingState';
import ErrorState from '../../../shared/ui/ErrorState';
import EmptyState from '../../../shared/ui/EmptyState';

// RF-275: filtro simple por localidad (texto libre) y por planta (selector del catálogo de M-02),
// tal como ya lo implementa el backend en GET /productos?localidad=&plantaId=.
function ProductosDirectorioPage({ onSeleccionar }: { onSeleccionar: (productoId: string) => void }) {
  const [productos, setProductos] = useState<ProductoVisible[] | null>(null);
  const [plantas, setPlantas] = useState<Planta[]>([]);
  const [localidad, setLocalidad] = useState('');
  const [plantaId, setPlantaId] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { listarPlantas().then(setPlantas).catch(() => {}); }, []);

  function cargar() {
    setError(null);
    listarProductos({ localidad: localidad.trim() || undefined, plantaId: plantaId || undefined })
      .then(setProductos)
      .catch(() => setError('No se pudo cargar el directorio de productos.'));
  }

  useEffect(cargar, []);

  return (
    <section>
      <SectionHeader
        eyebrow="Directorio"
        title="Productos"
        description="Productos elaborados con plantas amazónicas, publicados por productores de la comunidad."
      />

      <div className="filtro-bar">
        <label className="sr-only" htmlFor="filtro-localidad">Filtrar por localidad</label>
        <input id="filtro-localidad" type="text" placeholder="Filtrar por localidad" value={localidad} onChange={(e) => setLocalidad(e.target.value)} />
        <label className="sr-only" htmlFor="filtro-planta">Filtrar por planta</label>
        <select id="filtro-planta" value={plantaId} onChange={(e) => setPlantaId(e.target.value)}>
          <option value="">Todas las plantas</option>
          {plantas.map((p) => <option key={p.id} value={p.id}>{p.nombreComun}</option>)}
        </select>
        <Button variant="secondary" iconLeft={<Search size={15} aria-hidden="true" />} onClick={cargar}>Filtrar</Button>
      </div>

      {productos === null && !error && <LoadingState cards={6} label="Cargando directorio de productos" />}
      {error && <ErrorState description={error} />}
      {productos && productos.length === 0 && (
        <EmptyState title="No hay productos que coincidan" description="Prueba con otra localidad o planta, o quita los filtros para ver todo el directorio." />
      )}
      {productos && productos.length > 0 && (
        <div className="card-grid">
          {productos.map((p) => <ProductoCard key={p.id} producto={p} onAbrir={() => onSeleccionar(p.id)} />)}
        </div>
      )}
    </section>
  );
}

export default ProductosDirectorioPage;
