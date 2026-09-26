import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Lock, MapPin, Sprout, Sparkles } from 'lucide-react';
import { accesoProductoresDisponibles, listarProductoresDisponibles, type AccesoDisponibles, type ListadoDisponibles } from '../api/extras.api';
import { RUTAS_M15 } from '../api/planes.api';
import { getSession } from '../../../shared/auth/session';
import Button from '../../../shared/ui/Button';
import Badge from '../../../shared/ui/Badge';
import SectionHeader from '../../../shared/ui/SectionHeader';
import LoadingState from '../../../shared/ui/LoadingState';
import ErrorState from '../../../shared/ui/ErrorState';
import EmptyState from '../../../shared/ui/EmptyState';

const nombreVisible = (p: { nombre: string; nombreNegocio?: string }) => p.nombreNegocio ?? p.nombre;

// Productores disponibles (complemento Premium, hipótesis de negocio sin validar): directorio de productores que se marcaron "disponibles
// para contacto ahora". Bloqueado por defecto. Muestra lo mismo que el directorio de siempre; el contacto sigue siendo del plan/desbloqueo.
function ProductoresDisponiblesPage() {
  const navigate = useNavigate();
  const sesion = getSession();
  const [acceso, setAcceso] = useState<AccesoDisponibles | null>(null);
  const [datos, setDatos] = useState<ListadoDisponibles | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [planta, setPlanta] = useState(''); const [zona, setZona] = useState(''); const [tipo, setTipo] = useState('');

  useEffect(() => { accesoProductoresDisponibles().then(setAcceso).catch(() => setAcceso({ permitido: false, motivo: 'No se pudo comprobar tu acceso.' })); }, [sesion?.token]);
  useEffect(() => {
    if (!acceso?.permitido) return;
    listarProductoresDisponibles({ planta: planta || undefined, zona: zona || undefined, tipo: tipo || undefined }).then((d) => { setDatos((prev) => (prev && (planta || zona || tipo) ? { ...d, opciones: prev.opciones } : d)); setError(null); })
      .catch((e) => setError(e instanceof Error ? e.message : 'No se pudo cargar la lista.'));
  }, [acceso?.permitido, planta, zona, tipo]);

  return (
    <section>
      <Button variant="ghost" onClick={() => navigate(RUTAS_M15.productores)}>← Directorio de productores</Button>
      <SectionHeader eyebrow="Complemento Premium" title="Productores disponibles" description="Productores que marcaron que están disponibles para contacto ahora. Explóralos sin depender de encontrar primero un producto o una planta." />
      <p className="aviso-legal" role="note">Hipótesis de negocio todavía sin validar con productores ni especialistas. Nunca se muestra la ubicación exacta ni datos personales: el contacto directo sigue siendo de tu plan o de un desbloqueo puntual.</p>

      {!acceso && <LoadingState label="Comprobando tu acceso" />}
      {acceso && !acceso.permitido && (
        <div className="premium-bloqueado" role="region" aria-label="Sección bloqueada">
          <span className="premium-bloqueado-icono"><Lock size={22} aria-hidden="true" /></span>
          <h3>Esta sección está bloqueada</h3>
          <p>{acceso.motivo}</p>
          <ul className="plan-lista">
            <li><Sparkles size={15} aria-hidden="true" /> Directorio de productores marcados como disponibles ahora</li>
            <li><Sparkles size={15} aria-hidden="true" /> Filtros por planta, zona y tipo de productor</li>
            <li><Sparkles size={15} aria-hidden="true" /> Se suma encima de tu plan Negocio, Empresarial o Institucional</li>
          </ul>
          <Button variant="primary" onClick={() => navigate(sesion ? RUTAS_M15.planes : '/m01-cuentas/login')}>{sesion ? 'Ver planes y el complemento Premium' : 'Iniciar sesión'}</Button>
        </div>
      )}

      {acceso?.permitido && (
        <>
          <form className="filtro-bar" aria-label="Filtros de productores disponibles" onSubmit={(e) => e.preventDefault()}>
            <label>Planta
              <select value={planta} onChange={(e) => setPlanta(e.target.value)}><option value="">Todas</option>{datos?.opciones.plantas.map((p) => <option key={p} value={p}>{p}</option>)}</select>
            </label>
            <label>Zona
              <select value={zona} onChange={(e) => setZona(e.target.value)}><option value="">Todas</option>{datos?.opciones.zonas.map((z) => <option key={z} value={z}>{z}</option>)}</select>
            </label>
            <label>Tipo de productor
              <select value={tipo} onChange={(e) => setTipo(e.target.value)}><option value="">Todos</option>{datos?.opciones.tipos.map((t) => <option key={t} value={t}>{t}</option>)}</select>
            </label>
            {(planta || zona || tipo) && <Button type="button" variant="secondary" onClick={() => { setPlanta(''); setZona(''); setTipo(''); }}>Quitar filtros</Button>}
          </form>
          {error && <ErrorState description={error} />}
          {!datos && !error && <LoadingState label="Cargando productores disponibles" />}
          {datos && datos.productores.length === 0 && (
            <EmptyState title={planta || zona || tipo ? 'Ningún productor disponible coincide con esos filtros' : 'Ahora mismo no hay productores marcados como disponibles'} description="Los productores se marcan a sí mismos desde su perfil y la marca vence sola a los 7 días si no la renuevan." />
          )}
          {datos && datos.productores.length > 0 && (
            <div className="cards">
              {datos.productores.map((p) => (
                <article key={p.id} className="tarjeta-clicable" style={{ flex: '1 1 300px' }} tabIndex={0} role="button" aria-label={`Ver a ${nombreVisible(p)}`}
                  onClick={() => navigate(`${RUTAS_M15.productores}/${p.id}`)} onKeyDown={(e) => { if (e.key === 'Enter') navigate(`${RUTAS_M15.productores}/${p.id}`); }}>
                  <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
                    <Badge variant="success" icon={<Clock size={13} aria-hidden="true" />}>Disponible ahora</Badge>
                    {p.certificado && <Badge variant="info">Producto certificado</Badge>}
                    {p.tiposProductor.map((t) => <Badge key={t} variant="neutral">{t}</Badge>)}
                  </div>
                  <strong>{nombreVisible(p)}</strong>
                  {p.nombreNegocio && <span className="comentario-meta">{p.nombre}</span>}
                  <span className="productor-dato"><MapPin size={14} aria-hidden="true" /> {p.region}</span>
                  <span className="productor-dato"><Sprout size={14} aria-hidden="true" /> {p.plantas.join(', ')}</span>
                  {[...p.zonas, ...p.zonasProducto].length > 0 && <span className="productor-dato"><MapPin size={14} aria-hidden="true" /> {[...new Set([...p.zonas, ...p.zonasProducto])].join(' · ')}</span>}
                  {p.nota && <span className="comentario-meta">“{p.nota}”</span>}
                  <span className="comentario-meta">Disponible hasta el {new Date(p.disponibleHasta).toLocaleDateString('es-PE')}</span>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default ProductoresDisponiblesPage;
