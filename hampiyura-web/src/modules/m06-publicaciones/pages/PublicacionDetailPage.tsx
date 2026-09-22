import { useEffect, useState } from 'react';
import { obtenerPublicacion, eliminarPublicacion, type Publicacion, type PublicacionCreada } from '../api/publicaciones.api';
import EditarPublicacionForm from '../components/EditarPublicacionForm';
import PromedioEstrellas from '../components/PromedioEstrellas';
import TipoConocimientoBadge from '../../m04-usos-partes/components/TipoConocimientoBadge';
import ValoracionEstrellas from '../../m07-comunidad/components/ValoracionEstrellas';
import ComentariosSection from '../../m07-comunidad/components/ComentariosSection';
import RequireRole from '../../../shared/auth/RequireRole';
import { getSession, esAdministrador, suscribirseACambiosDeSesion } from '../../../shared/auth/session';

interface Props {
  publicacionId: string;
  onVolver: () => void;
  onEliminada: () => void;
}

function PublicacionDetailPage({ publicacionId, onVolver, onEliminada }: Props) {
  const [publicacion, setPublicacion] = useState<Publicacion | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editando, setEditando] = useState(false);
  const [editadaPendiente, setEditadaPendiente] = useState<PublicacionCreada | null>(null);
  const [sesion, setSesion] = useState(getSession());

  useEffect(() => suscribirseACambiosDeSesion(() => setSesion(getSession())), []);

  function cargar() {
    setCargando(true);
    setError(null);
    obtenerPublicacion(publicacionId)
      .then((p) => { setPublicacion(p); setEditando(false); })
      .catch(() => setError('No se pudo cargar la publicación (puede que ya no esté disponible).'))
      .finally(() => setCargando(false));
  }

  useEffect(cargar, [publicacionId]);

  async function manejarEliminar() {
    if (!window.confirm('¿Eliminar esta publicación? Esta acción no se puede deshacer.')) return;
    await eliminarPublicacion(publicacionId);
    onEliminada();
  }

  if (cargando) return <p>Cargando publicación…</p>;
  if (error) return <p>{error}</p>;

  // Tras editar, la publicación vuelve a "Pendiente" y GET /publicaciones/:id deja de mostrarla
  // (mismo criterio que para cualquier contenido no validado, ver M-04) -- incluso a su propio autor.
  // Por eso no se recarga el detalle: se confirma con la respuesta ya devuelta por la edición.
  if (editadaPendiente) {
    return (
      <section>
        <button onClick={onVolver}>← Volver al feed</button>
        <h2>{editadaPendiente.nombreComun}</h2>
        <p className="advertencia-no-verificado">
          ⚠ Tus cambios se guardaron. Esta publicación volvió a estado <strong>{editadaPendiente.estadoValidacion}</strong> y ya no es visible públicamente hasta que un especialista la revise nuevamente.
        </p>
      </section>
    );
  }

  if (!publicacion) return <p>No se encontró la publicación.</p>;

  const esAutor = sesion?.userId === publicacion.autorId;
  const puedeEliminar = esAutor || (sesion && esAdministrador(sesion.rol));

  return (
    <section>
      <button onClick={onVolver}>← Volver al feed</button>
      <h2>{publicacion.nombreComun}</h2>
      <p>Por {publicacion.autorNombre} · {new Date(publicacion.fechaPublicacion).toLocaleString()}</p>

      <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
        <TipoConocimientoBadge tipo={publicacion.tipoConocimiento} />
        <span className="badge badge-estado">{publicacion.estadoValidacion}</span>
      </div>
      {publicacion.verificado ? (
        <p className="sello-verificado">✔ Contenido verificado científicamente</p>
      ) : (
        <p className="advertencia-no-verificado">⚠ {publicacion.advertencia}</p>
      )}

      {publicacion.imagenes.length > 0 && (
        <div className="galeria-imagenes">
          {publicacion.imagenes.map((url) => <img key={url} src={url} alt={publicacion.nombreComun} />)}
        </div>
      )}

      <h3>Descripción</h3>
      <p>{publicacion.descripcion}</p>
      <h3>Enfermedades que ayuda a tratar</h3>
      <p>{publicacion.enfermedadesTratadas}</p>
      <h3>Forma de preparación</h3>
      <p>{publicacion.formaPreparacion}</p>
      <span className="fuente-cita">Fuente: {publicacion.fuente.valor}</span>

      <h3>Calificación</h3>
      <PromedioEstrellas promedio={publicacion.promedioEstrellas} total={publicacion.totalValoraciones} />
      <RequireRole permitido={() => true}>
        <ValoracionEstrellas publicacionId={publicacion.id} miValoracionInicial={publicacion.miValoracion} onCalificado={cargar} />
      </RequireRole>

      {(esAutor || puedeEliminar) && (
        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '.5rem' }}>
          {esAutor && !editando && <button onClick={() => setEditando(true)}>Editar</button>}
          {puedeEliminar && <button onClick={manejarEliminar}>Eliminar</button>}
        </div>
      )}
      {editando && esAutor && (
        <EditarPublicacionForm publicacion={publicacion} onGuardada={(actualizada) => { setEditando(false); setEditadaPendiente(actualizada); }} onCancelar={() => setEditando(false)} />
      )}

      <ComentariosSection publicacionId={publicacion.id} />
    </section>
  );
}

export default PublicacionDetailPage;
