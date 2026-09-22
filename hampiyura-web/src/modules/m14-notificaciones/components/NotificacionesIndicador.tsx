import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { listarNotificaciones, suscribirseACambiosDeNotificaciones } from '../api/notificaciones.api';
import { getSession, suscribirseACambiosDeSesion } from '../../../shared/auth/session';
import IconButton from '../../../shared/ui/IconButton';

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
    <IconButton
      icon={<Bell size={18} />}
      label="Notificaciones"
      badge={noLeidas}
      onBrand
      onClick={onAbrir}
    />
  );
}

export default NotificacionesIndicador;
