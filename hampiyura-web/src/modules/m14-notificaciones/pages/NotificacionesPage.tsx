import { useEffect, useState } from 'react';
import Button from '../../../shared/ui/Button';
import { listarNotificaciones, marcarTodasLeidas, marcarLeida, eliminarNotificacion, type Notificacion } from '../api/notificaciones.api';

// Los tipos viejos (comentario_nuevo, calificacion_nueva, contenido_aprobado, etc., de M-06/M-07/
// M-09) siguen sin `entidadTipo`/`entidadId` -- no se retroalimentaron con la referencia que
// agregó M-08, así que para esos no hay a dónde navegar (limitación real, no un descuido). Los
// únicos con navegación real hoy son los 2 tipos nuevos de M-08, que sí traen `entidadTipo:'Consulta'`.
function resolverNavegacion(n: Notificacion): { entidadTipo: 'Consulta'; entidadId: string } | null {
  if (n.entidadTipo === 'Consulta' && n.entidadId) return { entidadTipo: 'Consulta', entidadId: n.entidadId };
  return null;
}

interface Props {
  onVolver: () => void;
  onAbrirConsulta: (consultaId: string) => void;
}

function NotificacionesPage({ onVolver, onAbrirConsulta }: Props) {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function cargar() {
    setCargando(true);
    setError(null);
    listarNotificaciones().then(setNotificaciones).catch(() => setError('No se pudieron cargar las notificaciones.')).finally(() => setCargando(false));
  }

  useEffect(cargar, []);

  async function manejarMarcarTodas() { await marcarTodasLeidas(); cargar(); }
  async function manejarMarcarUna(id: string) { await marcarLeida(id); cargar(); }
  async function manejarEliminar(id: string) { await eliminarNotificacion(id); cargar(); }
  async function manejarClicNotificacion(n: Notificacion) {
    const navegacion = resolverNavegacion(n);
    if (!navegacion) return;
    if (!n.leida) await manejarMarcarUna(n.id);
    onAbrirConsulta(navegacion.entidadId);
  }

  const hayNoLeidas = notificaciones.some((n) => !n.leida);

  return (
    <section>
      <Button variant="ghost" onClick={onVolver}>← Volver al catálogo</Button>
      <h2>Notificaciones</h2>

      {cargando && <p>Cargando notificaciones…</p>}
      {error && <p>{error}</p>}
      {!cargando && !error && notificaciones.length === 0 && <p>Todavía no tienes notificaciones.</p>}

      {!cargando && !error && notificaciones.length > 0 && (
        <>
          <button onClick={manejarMarcarTodas} disabled={!hayNoLeidas} style={{ marginBottom: '1rem' }}>Marcar todas como leídas</button>
          {notificaciones.map((n) => {
            const navegacion = resolverNavegacion(n);
            return (
              <article
                key={n.id}
                className={`notificacion ${n.leida ? 'notificacion-leida' : 'notificacion-no-leida'}${navegacion ? ' tarjeta-clicable' : ''}`}
                onClick={navegacion ? () => manejarClicNotificacion(n) : undefined}
              >
                <span>{n.mensaje}{navegacion && ' →'}</span>
                <span className="comentario-meta">{new Date(n.fecha).toLocaleString()} · {n.leida ? 'Leída' : 'No leída'}</span>
                <div style={{ display: 'flex', gap: '.6rem' }} onClick={(e) => e.stopPropagation()}>
                  {!n.leida && <button onClick={() => manejarMarcarUna(n.id)}>Marcar como leída</button>}
                  <button onClick={() => manejarEliminar(n.id)}>Eliminar</button>
                </div>
              </article>
            );
          })}
        </>
      )}
    </section>
  );
}

export default NotificacionesPage;
