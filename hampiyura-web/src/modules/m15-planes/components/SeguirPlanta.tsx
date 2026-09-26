import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, BellRing } from 'lucide-react';
import { listarAlertas, seguirPlanta, dejarDeSeguirPlanta } from '../api/extras.api';
import { RUTAS_M15 } from '../api/planes.api';
import { getSession } from '../../../shared/auth/session';
import Button from '../../../shared/ui/Button';

// "Seguir esta planta" (plan Negocio): alertas de disponibilidad (productos nuevos con la planta) y de temporada (mes de cosecha).
function SeguirPlanta({ plantaId }: { plantaId: string }) {
  const navigate = useNavigate();
  const sesion = getSession();
  const [sigue, setSigue] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [trabajando, setTrabajando] = useState(false);

  useEffect(() => {
    if (!sesion) return;
    listarAlertas().then((a) => setSigue(a.some((x) => x.plantaId === plantaId))).catch(() => setSigue(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plantaId, sesion?.token]);
  if (!sesion) return null;

  async function alternar() {
    setTrabajando(true); setError(null);
    try {
      if (sigue) { await dejarDeSeguirPlanta(plantaId); setSigue(false); }
      else { await seguirPlanta(plantaId); setSigue(true); }
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo actualizar la alerta.'); }
    finally { setTrabajando(false); }
  }

  return (
    <div className="seguir-planta">
      <Button variant={sigue ? 'secondary' : 'ghost'} size="sm" disabled={trabajando} iconLeft={sigue ? <BellRing size={15} aria-hidden="true" /> : <Bell size={15} aria-hidden="true" />} onClick={alternar}>
        {sigue ? 'Siguiendo: dejar de seguir' : 'Seguir esta planta (alertas)'}
      </Button>
      {sigue && <span className="comentario-meta"> Te avisamos en Notificaciones. <button type="button" className="enlace-plan" onClick={() => navigate('/m15-planes/alertas')}>Ver mis alertas</button></span>}
      {error && <p className="error-formulario" role="alert">{error} <button type="button" className="enlace-plan" onClick={() => navigate(RUTAS_M15.planes)}>Ver planes</button></p>}
    </div>
  );
}

export default SeguirPlanta;
