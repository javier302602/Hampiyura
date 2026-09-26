import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, BellOff, Sprout } from 'lucide-react';
import { listarAlertas, dejarDeSeguirPlanta, type AlertaVisible } from '../api/extras.api';
import { RUTAS_M15 } from '../api/planes.api';
import RequireRole from '../../../shared/auth/RequireRole';
import Button from '../../../shared/ui/Button';
import Badge from '../../../shared/ui/Badge';
import SectionHeader from '../../../shared/ui/SectionHeader';
import LoadingState from '../../../shared/ui/LoadingState';
import ErrorState from '../../../shared/ui/ErrorState';
import EmptyState from '../../../shared/ui/EmptyState';

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

// Mis alertas (plan Negocio): plantas que sigues. Te avisamos (en Notificaciones) cuando hay productos nuevos con esa planta
// (disponibilidad) y cuando llega su mes de cosecha según las fichas de cultivo validadas (temporada).
function AlertasPage() {
  const navigate = useNavigate();
  const [alertas, setAlertas] = useState<AlertaVisible[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cargar = () => listarAlertas().then(setAlertas).catch((e) => setError(e instanceof Error ? e.message : 'No se pudieron cargar tus alertas.'));
  useEffect(() => { cargar(); }, []);
  async function quitar(plantaId: string) { await dejarDeSeguirPlanta(plantaId); cargar(); }

  return (
    <section>
      <SectionHeader eyebrow="Plan Negocio" title="Mis alertas" description="Sigue plantas desde su ficha y te avisamos en Notificaciones cuando haya productos nuevos con ellas o llegue su época de cosecha." />
      <RequireRole permitido={() => true}>
        {error && <ErrorState description={error} />}
        {!alertas && !error && <LoadingState label="Cargando tus alertas" />}
        {alertas && alertas.length === 0 && (
          <EmptyState icon={<BellOff size={22} aria-hidden="true" />} title="Todavía no sigues ninguna planta" description="Abre la ficha de una planta y pulsa “Seguir esta planta”. Las alertas son del plan Negocio o superior."
            action={<Button variant="primary" onClick={() => navigate('/m02-catalogo-plantas')}>Ver el catálogo de plantas</Button>} />
        )}
        {alertas && alertas.length > 0 && (
          <div className="cards">
            {alertas.map((a) => (
              <article key={a.plantaId} style={{ flex: '1 1 300px' }}>
                <strong><Sprout size={15} aria-hidden="true" /> {a.plantaNombre}</strong>
                <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
                  {a.disponibilidad && <Badge variant={a.productosDisponiblesAhora > 0 ? 'success' : 'neutral'} icon={<Bell size={13} aria-hidden="true" />}>Disponibilidad: {a.productosDisponiblesAhora > 0 ? `${a.productosDisponiblesAhora} producto(s) ahora` : 'sin productos todavía'}</Badge>}
                  {a.temporada && <Badge variant={a.enTemporadaAhora ? 'success' : 'neutral'} icon={<Bell size={13} aria-hidden="true" />}>Temporada: {a.enTemporadaAhora ? 'en cosecha este mes' : a.mesesCosecha.length ? `cosecha en ${a.mesesCosecha.map((m) => MESES[m - 1]).join(', ')}` : 'sin fichas de cultivo validadas'}</Badge>}
                </div>
                <div style={{ display: 'flex', gap: '.5rem' }}>
                  <Button size="sm" variant="secondary" onClick={() => navigate(`/m02-catalogo-plantas/${a.plantaId}`)}>Ver ficha</Button>
                  <Button size="sm" variant="ghost" onClick={() => quitar(a.plantaId)}>Dejar de seguir</Button>
                </div>
              </article>
            ))}
          </div>
        )}
        <p className="comentario-meta" style={{ marginTop: '1rem' }}>Si tu plan vence, tus alertas se conservan pero dejan de avisar hasta que lo renueves. <button type="button" className="enlace-plan" onClick={() => navigate(RUTAS_M15.planes)}>Ver planes</button></p>
      </RequireRole>
    </section>
  );
}

export default AlertasPage;
