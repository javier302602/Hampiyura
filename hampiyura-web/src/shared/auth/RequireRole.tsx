import { ReactNode, useEffect, useState } from 'react';
import { getSession, suscribirseACambiosDeSesion } from './session';

interface RequireRoleProps { permitido: (rol: string) => boolean; children: ReactNode; }

function RequireRole({ permitido, children }: RequireRoleProps) {
  const [session, setSession] = useState(getSession());

  // Sin esto, si la sesión cambia en otra parte del árbol (SessionBar) y nada más vuelve a
  // renderizar este componente, se queda mostrando el mensaje viejo indefinidamente.
  useEffect(() => suscribirseACambiosDeSesion(() => setSession(getSession())), []);

  if (!session) return <p>Inicia sesión para ver esta sección.</p>;
  if (!permitido(session.rol)) return <p>No tienes permisos para ver esta sección.</p>;
  return <>{children}</>;
}

export default RequireRole;
