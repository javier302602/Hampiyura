import { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, ShieldAlert } from 'lucide-react';
import { getSession, hayAvisoDeSesionExpirada, suscribirseACambiosDeSesion } from './session';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';

interface RequireRoleProps { permitido: (rol: string) => boolean; children: ReactNode; }

function RequireRole({ permitido, children }: RequireRoleProps) {
  const [session, setSession] = useState(getSession());
  const navigate = useNavigate();

  // Sin esto, si la sesión cambia en otra parte del árbol (SessionBar) y nada más vuelve a
  // renderizar este componente, se queda mostrando el mensaje viejo indefinidamente.
  useEffect(() => suscribirseACambiosDeSesion(() => setSession(getSession())), []);

  // Antes: un <p> plano sin salida -- justo lo que ve alguien sin sesión (o con la sesión vencida) al
  // hacer clic en un botón tan visible como "Proponer planta"/"Publicar producto".
  if (!session) {
    const expiro = hayAvisoDeSesionExpirada();
    return (
      <EmptyState
        icon={<LogIn size={22} aria-hidden="true" />}
        title={expiro ? 'Tu sesión expiró' : 'Inicia sesión para continuar'}
        description={expiro ? 'Por seguridad la sesión dura un día. Inicia sesión de nuevo para seguir donde lo dejaste.' : 'Necesitas una cuenta para ver esta sección.'}
        action={<Button variant="primary" onClick={() => navigate('/m01-cuentas/login')}>Iniciar sesión</Button>}
      />
    );
  }
  if (!permitido(session.rol)) {
    return <EmptyState icon={<ShieldAlert size={22} aria-hidden="true" />} title="Sin permisos" description="Tu rol no tiene acceso a esta sección." />;
  }
  return <>{children}</>;
}

export default RequireRole;
