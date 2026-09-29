import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../shared/ui/Button';
import { listarNotificaciones, marcarTodasLeidas, marcarLeida, eliminarNotificacion, type Notificacion } from '../api/notificaciones.api';

// Los tipos viejos (comentario_nuevo, calificacion_nueva, contenido_aprobado, etc., de M-06/M-07/
// M-09) siguen sin `entidadTipo`/`entidadId` -- no se retroalimentaron con la referencia que
// agregó M-08, así que para esos no hay a dónde navegar (limitación real, no un descuido). Los
// únicos con navegación real hoy son los 2 tipos nuevos de M-08, que sí traen `entidadTipo:'Consulta'`.
function resolverNavegacion(n: Notificacion): { entidadTipo: 'Consulta' | 'Conversacion' | 'Planta' | 'Pedido' | 'ContratoCultivo'; entidadId: string } | null {
  // Ronda 30: mensajes directos y alertas de seguimiento también traen referencia. Ronda 35: pedidos de compra
  // directa (M-16). Ronda 37: contratos de compra directa de cosecha (M-17).
  if ((n.entidadTipo === 'Consulta' || n.entidadTipo === 'Conversacion' || n.entidadTipo === 'Planta' || n.entidadTipo === 'Pedido' || n.entidadTipo === 'ContratoCultivo') && n.entidadId) return { entidadTipo: n.entidadTipo, entidadId: n.entidadId };
  return null;
}

interface Props {
  onVolver: () => void;
  onAbrirConsulta: (consultaId: string) => void;
}

function NotificacionesPage({ onVolver, onAbrirConsulta }: Props) {
  const navigate = useNavigate();
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
    if (navegacion.entidadTipo === 'Conversacion') navigate(`/m15-planes/mensajes?c=${encodeURIComponent(navegacion.entidadId)}`);
    else if (navegacion.entidadTipo === 'Planta') navigate(`/m02-catalogo-plantas/${encodeURIComponent(navegacion.entidadId)}`);
    else if (navegacion.entidadTipo === 'Pedido') navigate(`/m16-pedidos/${encodeURIComponent(navegacion.entidadId)}`);
    else if (navegacion.entidadTipo === 'ContratoCultivo') navigate(`/m17-compra-cultivo/${encodeURIComponent(navegacion.entidadId)}`);
    else onAbrirConsulta(navegacion.entidadId);
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
          <Button variant="secondary" onClick={manejarMarcarTodas} disabled={!hayNoLeidas} style={{ marginBottom: '1rem' }}>Marcar todas como leídas</Button>
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
                  {!n.leida && <Button size="sm" variant="secondary" onClick={() => manejarMarcarUna(n.id)}>Marcar como leída</Button>}
                  <Button size="sm" variant="ghost" onClick={() => manejarEliminar(n.id)}>Eliminar</Button>
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
