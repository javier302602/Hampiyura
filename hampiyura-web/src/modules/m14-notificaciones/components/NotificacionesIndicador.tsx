import { useEffect, useState } from 'react';
import { listarNotificaciones, suscribirseACambiosDeNotificaciones } from '../api/notificaciones.api';
import { getSession, suscribirseACambiosDeSesion } from '../../../shared/auth/session';

// Solo visible con sesión activa -- se oculta por completo para un usuario anónimo.
function NotificacionesIndicador({ onAbrir }: { onAbrir: () => void }) {
  const [sesion, setSesion] = useState(getSession());
  const [noLeidas, setNoLeidas] = useState(0);

  function cargarConteo() {
    if (!getSession()) { setNoLeidas(0); return; }
    listarNotificaciones().then((ns) => setNoLeidas(ns.filter((n) => !n.leida).length)).catch(() => {});
  }

  useEffect(() => suscribirseACambiosDeSesion(() => { setSesion(getSession()); cargarConteo(); }), []);
  useEffect(() => suscribirseACambiosDeNotificaciones(cargarConteo), []);
  useEffect(cargarConteo, []);

  if (!sesion) return null;

  return (
    <button className="boton-notificaciones" onClick={onAbrir}>
      🔔 Notificaciones{noLeidas > 0 && <span className="contador-notificaciones">{noLeidas}</span>}
    </button>
  );
}

export default NotificacionesIndicador;
