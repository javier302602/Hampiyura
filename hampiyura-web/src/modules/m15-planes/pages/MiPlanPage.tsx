import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RUTAS_EXTRAS } from '../api/extras.api';
import { obtenerMiPlan, RUTAS_M15, type EstadoPago, type MiPlan } from '../api/planes.api';
import RequireRole from '../../../shared/auth/RequireRole';
import Button from '../../../shared/ui/Button';
import Badge, { type BadgeVariant } from '../../../shared/ui/Badge';
import SectionHeader from '../../../shared/ui/SectionHeader';
import LoadingState from '../../../shared/ui/LoadingState';
import ErrorState from '../../../shared/ui/ErrorState';

export const VARIANTE_ESTADO_PAGO: Record<EstadoPago, BadgeVariant> = { Pendiente: 'warning', Confirmado: 'success', Rechazado: 'danger', Vencido: 'neutral' };
const fecha = (s?: string) => (s ? new Date(s).toLocaleDateString('es-PE') : '—');

// "Mi plan": plan activo, vencimiento y estado de pago, más los desbloqueos vigentes y el historial de pagos
// (con el motivo si un comprobante fue rechazado).
function MiPlanPage() {
  const navigate = useNavigate();
  const [plan, setPlan] = useState<MiPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { obtenerMiPlan().then(setPlan).catch(() => setError('No se pudo cargar tu plan.')); }, []);

  return (
    <section>
      <SectionHeader eyebrow="Mi cuenta" title="Mi plan y mis pagos" action={<Button variant="secondary" onClick={() => navigate(RUTAS_M15.planes)}>Ver planes</Button>} />
      <RequireRole permitido={() => true}>
        {error && <ErrorState description={error} />}
        {!plan && !error && <LoadingState label="Cargando tu plan" />}
        {plan && (
          <>
            <div className="mi-plan-resumen">
              <div><span className="mi-plan-etiqueta">Plan activo</span><strong>{plan.plan}</strong></div>
              <div><span className="mi-plan-etiqueta">Vencimiento</span><strong>{plan.plan === 'Explorador' ? 'No vence' : fecha(plan.vencimiento)}</strong></div>
              <div><span className="mi-plan-etiqueta">Productores disponibles</span><strong>{plan.premium.incluidoEnPlan ? <Badge variant="success">Incluido en tu plan</Badge> : plan.premium.activo ? <Badge variant="success">Premium activo hasta {fecha(plan.premium.vigenteHasta)}</Badge> : plan.plan === 'Negocio' ? 'Con el complemento Premium' : 'No incluido'}</strong></div>
              <div><span className="mi-plan-etiqueta">Estado de pago</span><strong>{plan.estadoPago ? <Badge variant={VARIANTE_ESTADO_PAGO[plan.estadoPago]}>{plan.estadoPago}</Badge> : 'Sin suscripción'}</strong></div>
            </div>

            <h3>Lo que incluye tu plan</h3>
            <div className="mi-plan-accesos">
              <Button variant="secondary" onClick={() => navigate(RUTAS_EXTRAS.mensajes)}>Mensajes</Button>
              <Button variant="secondary" onClick={() => navigate(RUTAS_EXTRAS.alertas)}>Mis alertas</Button>
              {plan.plan === 'Institucional' && <Button variant="secondary" onClick={() => navigate(RUTAS_EXTRAS.reportes)}>Reportes de bioeconomía regional</Button>}
              {plan.premium.activo && <Button variant="secondary" onClick={() => navigate(RUTAS_EXTRAS.disponibles)}>Productores disponibles</Button>}
            </div>
            {plan.plan === 'Explorador' && <p className="comentario-meta">Mensajes y alertas son del plan Negocio o superior; los reportes, del Institucional; “Productores disponibles” viene incluido en Empresarial e Institucional (con Negocio, se suma con el complemento Premium).</p>}

            <h3>Contactos desbloqueados</h3>
            {plan.desbloqueos.length === 0 ? <p className="comentario-meta">No tienes desbloqueos vigentes.</p> : (
              <ul className="lista-simple">
                {plan.desbloqueos.map((d) => <li key={d.productorId}><button type="button" className="enlace-boton" onClick={() => navigate(`${RUTAS_M15.productores}/${d.productorId}`)}>{d.productorNombre}</button> — vigente hasta {fecha(d.vigenteHasta)}</li>)}
              </ul>
            )}

            <h3>Historial de pagos</h3>
            {plan.pagos.length === 0 ? <p className="comentario-meta">Todavía no has enviado ningún pago.</p> : (
              <div className="cards">
                {plan.pagos.map((p) => (
                  <article key={p.id} style={{ flex: '1 1 300px' }}>
                    <div><Badge variant={VARIANTE_ESTADO_PAGO[p.estado]}>{p.estado}</Badge></div>
                    <strong>{p.conceptoTexto}</strong>
                    <span>S/ {p.monto.toFixed(2)} · {p.metodo} · enviado el {fecha(p.creadoEn)}</span>
                    {p.estado === 'Confirmado' && <span>Vigente hasta {fecha(p.vigenteHasta)}</span>}
                    {p.estado === 'Vencido' && <span>Venció el {fecha(p.vigenteHasta)}</span>}
                    {p.estado === 'Rechazado' && <span className="error-formulario">Motivo: {p.motivoRechazo}</span>}
                    {p.estado === 'Pendiente' && <span className="comentario-meta">Esperando que un administrador confirme tu pago.</span>}
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </RequireRole>
    </section>
  );
}

export default MiPlanPage;
