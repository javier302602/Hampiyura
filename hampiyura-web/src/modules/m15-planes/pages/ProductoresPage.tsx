import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Lock, MapPin, Phone, Sprout, Unlock } from 'lucide-react';
import { RUTAS_EXTRAS, escribirAProductor, MAX_CARACTERES_MENSAJE } from '../api/extras.api';
import { listarProductores, obtenerProductor, obtenerMiPlan, RUTAS_M15, type FiltrosDirectorio, type FichaProductor, type ProductorContactable } from '../api/planes.api';
import { listarZonasGenerales } from '../../m11-productos/api/productos.api';
import { getSession, esAdministrador } from '../../../shared/auth/session';
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
  // Filtros avanzados: solo con plan Empresarial o Institucional (el servidor lo vuelve a comprobar). Negocio y Explorador ven el directorio como siempre.
  const sesion = getSession();
  const [conFiltros, setConFiltros] = useState<boolean | null>(sesion && esAdministrador(sesion.rol) ? true : null);
  const [zonas, setZonas] = useState<string[]>([]);
  const [certificado, setCertificado] = useState(false);
  const [cantidadMinima, setCantidadMinima] = useState('');
  const [cerca, setCerca] = useState('');
  function cargar(f: FiltrosDirectorio = {}) {
    setError(null);
    listarProductores(f).then(setProductores).catch((e) => setError(e instanceof Error ? e.message : 'No se pudo cargar el directorio.'));
  }
  useEffect(() => { cargar(); }, []);
  useEffect(() => {
    if (!sesion) { setConFiltros(false); return; }
    if (esAdministrador(sesion.rol)) return;
    obtenerMiPlan().then((p) => setConFiltros(p.plan === 'Empresarial' || p.plan === 'Institucional')).catch(() => setConFiltros(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { if (conFiltros) listarZonasGenerales().then(setZonas).catch(() => {}); }, [conFiltros]);
  function aplicar() { cargar({ certificado: certificado || undefined, cantidadMinima: cantidadMinima.trim() ? Number(cantidadMinima) : undefined, cerca: cerca || undefined }); }
  function limpiar() { setCertificado(false); setCantidadMinima(''); setCerca(''); cargar(); }

  return (
    <section>
      <Button variant="ghost" onClick={() => navigate(RUTAS_M15.planes)}>← Ver planes</Button>
      <SectionHeader eyebrow="Directorio" title="Productores" description="Productores con una ficha de cultivo validada por un especialista. El contacto directo se abre con un plan o un desbloqueo puntual."
        action={<Button variant="secondary" onClick={() => navigate(RUTAS_EXTRAS.disponibles)}>Productores disponibles</Button>} />
      {conFiltros === true && (
        <form className="filtro-bar filtros-avanzados" aria-label="Filtros avanzados" onSubmit={(e) => { e.preventDefault(); aplicar(); }}>
          <label className="filtro-check"><input type="checkbox" checked={certificado} onChange={(e) => setCertificado(e.target.checked)} /> Solo con producto certificado</label>
          <label>Cantidad mínima ofrecida
            <input type="number" min={0} step="any" value={cantidadMinima} onChange={(e) => setCantidadMinima(e.target.value)} placeholder="Ej. 20" />
          </label>
          <label>Cerca de la zona
            <select value={cerca} onChange={(e) => setCerca(e.target.value)}>
              <option value="">Cualquier zona</option>
              {zonas.map((z) => <option key={z} value={z}>{z}</option>)}
            </select>
          </label>
          <div className="filtros-acciones">
            <Button type="submit" variant="primary">Aplicar filtros</Button>
            <Button type="button" variant="secondary" onClick={limpiar}>Quitar filtros</Button>
          </div>
          <p className="comentario-meta">La cantidad se lee del primer número que el productor puso en “cantidad disponible”. La cercanía usa la zona general (provincia y departamento), nunca el punto exacto.</p>
        </form>
      )}
      {conFiltros === false && (
        <p className="filtros-bloqueados" role="note"><Lock size={15} aria-hidden="true" /> Los filtros avanzados (cantidad, certificación y cercanía) son del plan <strong>Empresarial</strong> o <strong>Institucional</strong>. <button type="button" className="enlace-plan" onClick={() => navigate(RUTAS_M15.planes)}>Ver planes</button></p>
      )}
      {error && <ErrorState description={error} />}
      {!productores && !error && <LoadingState label="Cargando productores" />}
      {productores && productores.length === 0 && <EmptyState title="Todavía no hay productores contactables" description="Aparecerán cuando tengan una ficha de cultivo validada." />}
      {productores && productores.length > 0 && (
        <div className="cards">
          {productores.map((p) => (
            <article key={p.id} className="tarjeta-clicable" style={{ flex: '1 1 300px' }} tabIndex={0} role="button" aria-label={`Ver a ${nombreVisible(p)}`}
              onClick={() => navigate(`${RUTAS_M15.productores}/${p.id}`)} onKeyDown={(e) => { if (e.key === 'Enter') navigate(`${RUTAS_M15.productores}/${p.id}`); }}>
              <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
                <Badge variant="success">Ficha de cultivo validada</Badge>
                {p.certificado && <Badge variant="info">Producto certificado</Badge>}
                {p.cercania === 'zona' && <Badge variant="accent">Misma zona</Badge>}
                {p.cercania === 'departamento' && <Badge variant="neutral">Mismo departamento</Badge>}
              </div>
              <strong>{nombreVisible(p)}</strong>
              {p.nombreNegocio && <span className="comentario-meta">{p.nombre}</span>}
              <span className="productor-dato"><MapPin size={14} aria-hidden="true" /> {p.region}</span>
              <span className="productor-dato"><Sprout size={14} aria-hidden="true" /> {p.plantas.join(', ')}</span>
              {p.zonasProducto.length > 0 && <span className="productor-dato"><MapPin size={14} aria-hidden="true" /> Productos en: {p.zonasProducto.join(' · ')}</span>}
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
  const sesion = getSession();
  const [plan, setPlan] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);
  useEffect(() => { if (sesion) obtenerMiPlan().then((p) => setPlan(p.plan)).catch(() => setPlan(null)); }, [sesion?.token]);
  async function enviarMensaje(e: FormEvent) {
    e.preventDefault(); setEnviando(true); setErrorMensaje(null);
    try { const r = await escribirAProductor(productorId, mensaje); navigate(`${RUTAS_EXTRAS.mensajes}?c=${encodeURIComponent(r.conversacionId)}`); }
    catch (err) { setErrorMensaje(err instanceof Error ? err.message : 'No se pudo enviar el mensaje.'); }
    finally { setEnviando(false); }
  }
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
            <Badge variant="success">Ficha de cultivo validada</Badge>
          </div>
          <dl className="detalle-campos" style={{ maxWidth: 640 }}>
            {ficha.nombreNegocio && <div><dt>Responsable</dt><dd>{ficha.nombre}</dd></div>}
            <div><dt>Región</dt><dd>{ficha.region}</dd></div>
            <div><dt>Cultiva</dt><dd>{ficha.plantas.join(', ')}</dd></div>
            <div><dt>Zonas registradas</dt><dd>{ficha.zonas.join(' · ')}</dd></div>
          </dl>

          {sesion && sesion.rol !== 'Productor' && (
            <div className="mensaje-directo" role="region" aria-label="Mensaje directo">
              <h3>Mensaje directo</h3>
              {plan && plan !== 'Explorador' ? (
                <form onSubmit={enviarMensaje}>
                  <label className="sr-only" htmlFor="mensaje-directo-texto">Tu mensaje</label>
                  <textarea id="mensaje-directo-texto" rows={3} maxLength={MAX_CARACTERES_MENSAJE} value={mensaje} onChange={(e) => setMensaje(e.target.value)} placeholder="Escribe tu mensaje al productor…" />
                  <Button type="submit" variant="primary" disabled={enviando || !mensaje.trim()}>Enviar mensaje</Button>
                  {errorMensaje && <p className="error-formulario" role="alert">{errorMensaje}</p>}
                </form>
              ) : (
                <p className="comentario-meta">La mensajería directa dentro de la plataforma es del plan Negocio o superior. <button type="button" className="enlace-plan" onClick={() => navigate(RUTAS_M15.planes)}>Ver planes</button></p>
              )}
            </div>
          )}

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
              <p>Necesitas un plan activo o desbloquear el contacto de este productor.</p>
              <Button variant="primary" onClick={() => navigate(`${RUTAS_M15.planes}?productor=${encodeURIComponent(ficha.id)}`)}>Contactar</Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
