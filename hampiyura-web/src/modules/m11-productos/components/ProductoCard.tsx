import type { ProductoVisible } from '../api/productos.api';

function ProductoCard({ producto, onAbrir }: { producto: ProductoVisible; onAbrir: () => void }) {
  return (
    <article className="tarjeta-clicable" onClick={onAbrir}>
      {producto.fotografias[0] && <img src={producto.fotografias[0]} alt={producto.nombre} style={{ width: '100%', maxHeight: '160px', objectFit: 'cover', borderRadius: '10px' }} />}
      <strong>{producto.nombre}</strong>
      <span>Por {producto.productorNombre} · {producto.localidad}</span>
      <span>{producto.plantasNombres.join(', ')}</span>
      {producto.precioReferencial && <span>Precio ref.: {producto.precioReferencial}</span>}
    </article>
  );
}

export default ProductoCard;
