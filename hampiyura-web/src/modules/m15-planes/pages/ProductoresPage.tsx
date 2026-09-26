import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Lock, MapPin, Phone, Sprout, Star, Unlock } from 'lucide-react';
import { listarProductores, obtenerProductor, RUTAS_M15, type FichaProductor, type ProductorContactable } from '../api/planes.api';
import Button from '../../../shared/ui/Button';
import Badge from '../../../shared/ui/Badge';
import SectionHeader from '../../../shared/ui/SectionHeader';
import LoadingState from '../../../shared/ui/LoadingState';
import ErrorState from '../../../shared/ui/ErrorState';
import EmptyState from '../../../shared/ui/EmptyState';

const nombreVisible = (p: { nombre: string; nombreNegocio?: string }) => p.nombreNegocio ?? p.nombre;

// Directorio de productores contactables. Solo aparecen productores con una ficha de cultivo VALIDADA (M-03 → M-09).
// No se muestran coordenadas: solo zona y plantas (RN-07). El contacto se ve únicamente con plan activo o desbloqueo.
export function ProductoresPage() {
  const navigate = useNavigate();
  const [productores, setProductores] = useState<ProductorContactable[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { listarProductores().then(setProductores).catch(() => setError('No se pudo cargar el directorio.')); }, []);

  return (
    <section>
      <Button variant="ghost" onClick={() => navigate(RUTAS_M15.planes)}>← Ver planes</Button>
      <SectionHeader eyebrow="Directorio" title="Productores" description="Productores con una ficha de cultivo validada por un especialista. El contacto directo se abre con un plan o un desbloqueo puntual." />
      {error && <ErrorState description={error} />}
      {!productores && !error && <LoadingState label="Cargando productores" />}
      {productores && productores.length === 0 && <EmptyState title="Todavía no hay productores contactables" description="Aparecerán cuando tengan una ficha de cultivo validada." />}
      {productores && productores.length > 0 && (
        <div className="cards">
          {productores.map((p) => (
            <article key={p.id} className="tarjeta-clicable" style={{ flex: '1 1 300px' }} tabIndex={0} role="button" aria-label={`Ver a ${nombreVisible(p)}`}
              onClick={() => navigate(`${RUTAS_M15.productores}/${p.id}`)} onKeyDown={(e) => { if (e.key === 'Enter') navigate(`${RUTAS_M15.productores}/${p.id}`); }}>
              <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
                {p.destacado && <Badge variant="accent" icon={<Star size={13} aria-hidden="true" />}>Destacado</Badge>}
                <Badge variant="success">Ficha de cultivo validada</Badge>
              </div>
              <strong>{nombreVisible(p)}</strong>
              {p.nombreNegocio && <span className="comentario-meta">{p.nombre}</span>}
              <span className="productor-dato"><MapPin size={14} aria-hidden="true" /> {p.region}</span>
              <span className="productor-dato"><Sprout size={14} aria-hidden="true" /> {p.plantas.join(', ')}</span>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export function ProductorPage() {
  const navigate = useNavigate();
  const { productorId = '' } = useParams();
  const [ficha, setFicha] = useState<FichaProductor | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { obtenerProductor(productorId).then(setFicha).catch((e) => setError(e instanceof Error ? e.message : 'No se pudo cargar el productor.')); }, [productorId]);

  return (
    <section>
      <Button variant="ghost" onClick={() => navigate(RUTAS_M15.productores)}>← Volver al directorio</Button>
      {error && <ErrorState description={error} />}
      {!ficha && !error && <LoadingState label="Cargando productor" />}
      {ficha && (
        <>
          <SectionHeader eyebrow="Productor" title={nombreVisible(ficha)} description={ficha.biografia} />
          <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', margin: '0 0 1rem' }}>
            {ficha.destacado && <Badge variant="accent" icon={<Star size={13} aria-hidden="true" />}>Destacado</Badge>}
            <Badge variant="success">Ficha de cultivo validada</Badge>
          </div>
          <dl className="detalle-campos" style={{ maxWidth: 640 }}>
            {ficha.nombreNegocio && <div><dt>Responsable</dt><dd>{ficha.nombre}</dd></div>}
            <div><dt>Región</dt><dd>{ficha.region}</dd></div>
            <div><dt>Cultiva</dt><dd>{ficha.plantas.join(', ')}</dd></div>
            <div><dt>Zonas registradas</dt><dd>{ficha.zonas.join(' · ')}</dd></div>
          </dl>

          {ficha.contactoDisponible && ficha.contacto ? (
            <div className="contacto-abierto" role="region" aria-label="Contacto del productor">
              <h3><Unlock size={18} aria-hidden="true" /> Contacto</h3>
              {ficha.contacto.telefono && <p className="productor-dato"><Phone size={15} aria-hidden="true" /> {ficha.contacto.telefono}</p>}
              {ficha.contacto.contactosDeProductos.map((c) => <p key={c} className="productor-dato"><Phone size={15} aria-hidden="true" /> {c}</p>)}
              {!ficha.contacto.telefono && ficha.contacto.contactosDeProductos.length === 0 && <p className="comentario-meta">Este productor todavía no registró un medio de contacto.</p>}
              {ficha.desbloqueoHasta && <p className="comentario-meta">Desbloqueo vigente hasta el {new Date(ficha.desbloqueoHasta).toLocaleDateString('es-PE')}.</p>}
            </div>
          ) : (
            <div className="contacto-bloqueado" role="region" aria-label="Contacto bloqueado">
              <h3><Lock size={18} aria-hidden="true" /> El contacto está bloqueado</h3>
              <p>Necesitas un plan activo (Negocio o Institucional) o desbloquear el contacto de este productor.</p>
              <Button variant="primary" onClick={() => navigate(`${RUTAS_M15.planes}?productor=${encodeURIComponent(ficha.id)}`)}>Contactar</Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
