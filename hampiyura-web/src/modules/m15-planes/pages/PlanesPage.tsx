import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Clock, Leaf, Lock, Users } from 'lucide-react';
import { obtenerCatalogoPlanes, obtenerProductor, obtenerMiPlan, RUTAS_M15, type CatalogoPlanes, type DefinicionPlan, type FichaProductor, type MiPlan } from '../api/planes.api';
import { getSession } from '../../../shared/auth/session';
import Button from '../../../shared/ui/Button';
import Badge from '../../../shared/ui/Badge';
import SectionHeader from '../../../shared/ui/SectionHeader';
import LoadingState from '../../../shared/ui/LoadingState';
import ErrorState from '../../../shared/ui/ErrorState';

function nombreDe(p: FichaProductor) { return p.nombreNegocio ? `${p.nombreNegocio} (${p.nombre})` : p.nombre; }

// Página de planes (M-15). Los precios son de REFERENCIA (hipótesis del modelo de negocio, cap. 4): la
// página lo dice arriba y en cada tarjeta. Lo que aún no existe en la plataforma va en "Próximamente",
// no en "Incluye". A esta página llega el botón "Contactar" de un productor sin plan activo (?productor=id).
function PlanesPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const productorId = params.get('productor');
  const sesion = getSession();
  const [catalogo, setCatalogo] = useState<CatalogoPlanes | null>(null);
  const [miPlan, setMiPlan] = useState<MiPlan | null>(null);
  const [productor, setProductor] = useState<FichaProductor | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { obtenerCatalogoPlanes().then(setCatalogo).catch(() => setError('No se pudieron cargar los planes.')); }, []);
  useEffect(() => { if (sesion) obtenerMiPlan().then(setMiPlan).catch(() => {}); }, [sesion?.token]);
  useEffect(() => { if (productorId) obtenerProductor(productorId).then(setProductor).catch(() => setProductor(null)); }, [productorId]);

  function irAPagar(id: DefinicionPlan['id']) {
    const destino = id === 'DesbloqueoPuntual'
      ? `${RUTAS_M15.pagar}?concepto=Desbloqueo&productor=${encodeURIComponent(productorId ?? '')}`
      : `${RUTAS_M15.pagar}?concepto=Plan&plan=${id}`;
    if (!sesion) { navigate('/m01-cuentas/login'); return; }
    navigate(destino);
  }

  if (error) return <ErrorState description={error} />;
  if (!catalogo) return <LoadingState label="Cargando planes" />;

  const planActual = miPlan?.plan ?? 'Explorador';

  function accion(p: DefinicionPlan) {
    if (p.id === 'Explorador') return <Badge variant="success" icon={<Check size={14} aria-hidden="true" />}>Siempre incluido</Badge>;
    if (p.id === 'Productor') return sesion ? <Badge variant="neutral">Gratis para cuentas de Productor</Badge> : <Button variant="secondary" onClick={() => navigate('/m01-cuentas/registro')}>Registrarme como productor</Button>;
    if (p.id === 'DesbloqueoPuntual') {
      return productor
        ? <Button variant="primary" onClick={() => irAPagar(p.id)}>Desbloquear este contacto</Button>
        : <Button variant="secondary" onClick={() => navigate(RUTAS_M15.productores)}>Elegir un productor</Button>;
    }
    if (p.id === 'Destacado' && sesion && !(sesion.rol === 'Productor')) return <Badge variant="neutral">Solo cuentas de Productor</Badge>;
    if ((p.id === 'Negocio' || p.id === 'Institucional') && planActual === p.id) return <Badge variant="success" icon={<Check size={14} aria-hidden="true" />}>Tu plan actual</Badge>;
    return <Button variant={p.id === 'Negocio' ? 'primary' : 'secondary'} onClick={() => irAPagar(p.id)}>{sesion ? `Elegir ${p.nombre}` : 'Iniciar sesión para elegir'}</Button>;
  }

  return (
    <section>
      <SectionHeader eyebrow="Contacto y planes" title="Información gratis, contacto de pago" description="Aprender sobre las plantas es siempre gratis. Pagas solo cuando necesitas el contacto directo de quien las cultiva." />

      <p className="aviso-legal" role="note">
        <strong>Los planes son solo para ver el contacto de los productores.</strong> Sirven a cualquier persona que quiera comprar o contactar, sea Productor, Empresario, Institución de investigación o usuario normal. No hacen falta para publicar ni para cambiar tu tipo de cuenta, que es gratis; publicar productos solo tiene la comisión del 5% sobre ventas.
      </p>

      <p className="aviso-legal" role="note">
        <strong>Precios de referencia.</strong> Son una primera hipótesis de trabajo del modelo de negocio, todavía por validar con productores reales y un especialista en negocios. Pueden cambiar.
      </p>

      {productorId && (
        <div className="planes-contexto" role="status">
          <Lock size={18} aria-hidden="true" />
          <div>
            <strong>{productor ? `Para contactar a ${nombreDe(productor)} necesitas un plan o un desbloqueo.` : 'Para ver este contacto necesitas un plan o un desbloqueo.'}</strong>
            <p>El desbloqueo puntual abre solo el contacto de este productor durante 30 días; un plan (Negocio o Institucional) abre los contactos de todos.</p>
          </div>
        </div>
      )}

      {miPlan && (
        <p className="comentario-meta">
          Tu plan actual: <strong>{miPlan.plan}</strong>{miPlan.vencimiento ? ` (vence el ${new Date(miPlan.vencimiento).toLocaleDateString('es-PE')})` : ''} ·{' '}
          <button type="button" className="enlace-boton" onClick={() => navigate(RUTAS_M15.miPlan)}>Ver mis planes y pagos</button>
        </p>
      )}

      <div className="planes-grid">
        {catalogo.planes.map((p) => (
          <article key={p.id} className={`plan-card${p.id === 'Negocio' ? ' plan-card-destacada' : ''}${p.id === 'DesbloqueoPuntual' && productorId ? ' plan-card-destacada' : ''}`} aria-labelledby={`plan-${p.id}`}>
            <header>
              <h3 id={`plan-${p.id}`}>{p.nombre}</h3>
              <p className="plan-precio">{p.precioTexto}</p>
              <p className="plan-referencial">Precio de referencia</p>
            </header>
            <p className="plan-para">{p.paraQuien}</p>
            <ul className="plan-lista">
              {p.incluye.map((i) => <li key={i}><Check size={15} aria-hidden="true" /> {i}</li>)}
            </ul>
            {p.proximamente.length > 0 && (
              <div className="plan-proximamente">
                <p><Clock size={14} aria-hidden="true" /> Próximamente (aún no disponible)</p>
                <ul>{p.proximamente.map((i) => <li key={i}>{i}</li>)}</ul>
              </div>
            )}
            <footer>{accion(p)}</footer>
          </article>
        ))}
      </div>

      <div className="planes-pie">
        <div className="planes-pie-bloque">
          <Users size={18} aria-hidden="true" />
          <p>Solo aparecen como contactables los productores con una <strong>ficha de cultivo validada</strong> por un especialista. Ningún plan salta esa revisión ni muestra ubicaciones exactas de especies en riesgo.</p>
          <Button variant="ghost" onClick={() => navigate(RUTAS_M15.productores)}>Ver el directorio de productores</Button>
        </div>
        <div className="planes-pie-bloque">
          <Leaf size={18} aria-hidden="true" />
          <p>
            <strong>Fondo de conservación:</strong> el {catalogo.fondoConservacion.porcentaje} % (hipótesis) de lo confirmado en los planes se destinará a conservación.
            Contador actual: <strong>S/ {catalogo.fondoConservacion.acumuladoSoles.toFixed(2)}</strong>. Es solo un contador: todavía no se transfiere dinero real.
          </p>
        </div>
      </div>
    </section>
  );
}

export default PlanesPage;
