import type { Publicacion } from '../api/publicaciones.api';
import PromedioEstrellas from './PromedioEstrellas';

function PublicacionCard({ publicacion, onAbrir }: { publicacion: Publicacion; onAbrir: () => void }) {
  return (
    <article className="tarjeta-clicable" onClick={onAbrir}>
      {publicacion.imagenes[0] && <img src={publicacion.imagenes[0]} alt={publicacion.nombreComun} style={{ width: '100%', maxHeight: '160px', objectFit: 'cover', borderRadius: '10px' }} />}
      <strong>{publicacion.nombreComun}</strong>
      <span>Por {publicacion.autorNombre} · {new Date(publicacion.fechaPublicacion).toLocaleDateString()}</span>
      <PromedioEstrellas promedio={publicacion.promedioEstrellas} total={publicacion.totalValoraciones} />
      <span>{publicacion.totalComentarios} comentario(s)</span>
    </article>
  );
}

export default PublicacionCard;
