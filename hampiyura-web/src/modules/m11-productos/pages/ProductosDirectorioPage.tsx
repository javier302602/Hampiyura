import { useEffect, useState } from 'react';
import { listarProductos, type ProductoVisible } from '../api/productos.api';
import { listarPlantas, type Planta } from '../../m02-catalogo-plantas/api/plantas.api';
import ProductoCard from '../components/ProductoCard';

// RF-275: filtro simple por localidad (texto libre) y por planta (selector del catálogo de M-02),
// tal como ya lo implementa el backend en GET /productos?localidad=&plantaId=.
function ProductosDirectorioPage({ onSeleccionar }: { onSeleccionar: (productoId: string) => void }) {
  const [productos, setProductos] = useState<ProductoVisible[]>([]);
  const [plantas, setPlantas] = useState<Planta[]>([]);
  const [localidad, setLocalidad] = useState('');
  const [plantaId, setPlantaId] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { listarPlantas().then(setPlantas).catch(() => {}); }, []);

  function cargar() {
    setCargando(true);
    setError(null);
    listarProductos({ localidad: localidad.trim() || undefined, plantaId: plantaId || undefined })
      .then(setProductos)
      .catch(() => setError('No se pudo cargar el directorio de productos.'))
      .finally(() => setCargando(false));
  }

  useEffect(cargar, []);

  return (
    <section>
      <h2>Directorio de productos (M-11)</h2>
      <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <input type="text" placeholder="Filtrar por localidad" value={localidad} onChange={(e) => setLocalidad(e.target.value)} />
        <select value={plantaId} onChange={(e) => setPlantaId(e.target.value)}>
          <option value="">Todas las plantas</option>
          {plantas.map((p) => <option key={p.id} value={p.id}>{p.nombreComun}</option>)}
        </select>
        <button onClick={cargar}>Filtrar</button>
      </div>
      {cargando && <p>Cargando productos…</p>}
      {error && <p>{error}</p>}
      {!cargando && !error && productos.length === 0 && <p>No hay productos aprobados que coincidan con el filtro.</p>}
      {!cargando && !error && productos.length > 0 && (
        <div className="cards">
          {productos.map((p) => <ProductoCard key={p.id} producto={p} onAbrir={() => onSeleccionar(p.id)} />)}
        </div>
      )}
    </section>
  );
}

export default ProductosDirectorioPage;
