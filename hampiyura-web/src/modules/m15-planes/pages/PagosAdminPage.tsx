import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, Eye, XCircle } from 'lucide-react';
import { listarPagos, obtenerDetallePago, confirmarPago, rechazarPago, type PagoVisible } from '../api/planes.api';
import { VARIANTE_ESTADO_PAGO } from './MiPlanPage';
import Modal from '../../../shared/ui/Modal';
import Button from '../../../shared/ui/Button';
import Badge from '../../../shared/ui/Badge';

type Filtro = 'Pendiente' | 'Confirmado' | 'Rechazado' | 'Todos';
const FILTROS: { valor: Filtro; etiqueta: string }[] = [
  { valor: 'Pendiente', etiqueta: 'Pendientes' }, { valor: 'Confirmado', etiqueta: 'Confirmados' },
  { valor: 'Rechazado', etiqueta: 'Rechazados' }, { valor: 'Todos', etiqueta: 'Todos' },
];
const fechaHora = (s?: string) => (s ? new Date(s).toLocaleString('es-PE') : '—');

// Detalle ANTES de decidir (mismo patrón que la bandeja de validación de M-09): la persona ve el comprobante
// en grande, el monto, quién pagó y por qué concepto; recién ahí confirma o rechaza (con motivo escrito).
function DetallePago({ id, onCerrar, onResuelto }: { id: string; onCerrar: () => void; onResuelto: () => void }) {
  const [pago, setPago] = useState<PagoVisible | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rechazando, setRechazando] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [procesando, setProcesando] = useState(false);
  useEffect(() => { obtenerDetallePago(id).then(setPago).catch((e) => setError(e instanceof Error ? e.message : 'No se pudo cargar el pago.')); }, [id]);

  async function ejecutar(fn: () => Promise<void>) {
    setProcesando(true); setError(null);
    try { await fn(); onResuelto(); onCerrar(); }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudo completar la acción.'); }
    finally { setProcesando(false); }
  }

  const pie = pago && pago.estado === 'Pendiente' ? (
    <>
      {rechazando && (
        <label style={{ display: 'grid', gap: 'var(--space-1)', fontWeight: 600 }}>
          Motivo del rechazo (la persona lo verá en “Mi plan”)
          <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={3} autoFocus required />
        </label>
      )}
      {error && <p className="error-formulario" role="alert">{error}</p>}
      <div className="modal-pie-acciones">
        {!rechazando ? (
          <>
            <Button variant="primary" loading={procesando} iconLeft={<CheckCircle2 size={16} aria-hidden="true" />} onClick={() => ejecutar(() => confirmarPago(id))}>Confirmar pago</Button>
            <Button variant="danger" iconLeft={<XCircle size={16} aria-hidden="true" />} onClick={() => { setRechazando(true); setError(null); }}>Rechazar</Button>
          </>
        ) : (
          <>
            <Button variant="danger" loading={procesando} disabled={!motivo.trim()} onClick={() => ejecutar(() => rechazarPago(id, motivo.trim()))}>Confirmar rechazo</Button>
            <Button variant="ghost" onClick={() => { setRechazando(false); setError(null); }}>Volver</Button>
          </>
        )}
      </div>
    </>
  ) : (error ? <p className="error-formulario" role="alert">{error}</p> : undefined);

  return (
    <Modal titulo={pago ? pago.conceptoTexto : 'Detalle del pago'} onCerrar={onCerrar} pie={pie}>
      {!pago && !error && <p>Cargando detalle…</p>}
      {pago && (
        <>
          <div className="detalle-meta">
            <Badge variant={VARIANTE_ESTADO_PAGO[pago.estado]}>{pago.estado}</Badge>
            <p>Enviado por <strong>{pago.usuarioNombre}</strong> ({pago.usuarioCorreo}) · {fechaHora(pago.creadoEn)}</p>
          </div>
          <a href={pago.comprobanteUrl} target="_blank" rel="noopener noreferrer" className="comprobante-enlace" title="Abrir el comprobante en tamaño completo">
            <img src={pago.comprobanteUrl} alt="Comprobante de pago enviado" className="comprobante-grande" />
          </a>
          <dl className="detalle-campos">
            <div><dt>Monto que debe coincidir</dt><dd>S/ {pago.monto.toFixed(2)}</dd></div>
            <div><dt>Método</dt><dd>{pago.metodo}</dd></div>
            <div><dt>Número de operación</dt><dd>{pago.numeroOperacion ?? 'No informado'}</dd></div>
            <div><dt>Concepto</dt><dd>{pago.conceptoTexto}</dd></div>
            {pago.estado !== 'Pendiente' && <div><dt>Resuelto por</dt><dd>{pago.revisadoPorNombre ?? '—'} · {fechaHora(pago.revisadoEn)}</dd></div>}
            {pago.vigenteHasta && <div><dt>Vigente hasta</dt><dd>{fechaHora(pago.vigenteHasta)}</dd></div>}
            {pago.motivoRechazo && <div><dt>Motivo del rechazo</dt><dd>{pago.motivoRechazo}</dd></div>}
          </dl>
        </>
      )}
    </Modal>
  );
}

function PagosAdminPage() {
  // Las tarjetas del panel llegan aquí con ?estado=Pendiente|Confirmado|Rechazado ya aplicado.
  const [params] = useSearchParams();
  const inicial = params.get('estado');
  const [filtro, setFiltro] = useState<Filtro>(FILTROS.some((f) => f.valor === inicial) ? (inicial as Filtro) : 'Pendiente');
  const [pagos, setPagos] = useState<PagoVisible[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [abierto, setAbierto] = useState<string | null>(null);

  function cargar() {
    setCargando(true); setError(null);
    listarPagos(filtro === 'Todos' ? undefined : filtro).then(setPagos).catch(() => setError('No se pudo cargar la bandeja de pagos.')).finally(() => setCargando(false));
  }
  useEffect(cargar, [filtro]);

  return (
    <section className="gestion-panel">
      <h2>Confirmación de pagos</h2>
      <div role="group" aria-label="Filtrar por estado" style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        {FILTROS.map((f) => <Button key={f.valor} size="sm" variant={filtro === f.valor ? 'primary' : 'secondary'} aria-pressed={filtro === f.valor} onClick={() => setFiltro(f.valor)}>{f.etiqueta}</Button>)}
      </div>
      {cargando ? <p>Cargando pagos…</p> : error ? <p className="error-formulario" role="alert">{error}</p> : pagos.length === 0 ? (
        <p>{filtro === 'Pendiente' ? 'No hay pagos pendientes de confirmación.' : 'No hay pagos en este estado.'}</p>
      ) : (
        <div className="cards">
          {pagos.map((p) => (
            <article key={p.id} className="tarjeta-clicable" style={{ flex: '1 1 300px' }} tabIndex={0} role="button" aria-label={`Ver detalle del pago: ${p.conceptoTexto}`}
              onClick={() => setAbierto(p.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setAbierto(p.id); } }}>
              <div><Badge variant={VARIANTE_ESTADO_PAGO[p.estado]}>{p.estado}</Badge></div>
              <strong>{p.conceptoTexto}</strong>
              <span>S/ {p.monto.toFixed(2)} · {p.metodo}</span>
              <span className="comentario-meta">{p.usuarioNombre} · {fechaHora(p.creadoEn)}</span>
              <div style={{ marginTop: '.5rem' }}>
                <Button size="sm" variant="secondary" iconLeft={<Eye size={15} aria-hidden="true" />} tabIndex={-1} onClick={(e) => { e.stopPropagation(); setAbierto(p.id); }}>Ver comprobante y decidir</Button>
              </div>
            </article>
          ))}
        </div>
      )}
      {abierto && <DetallePago id={abierto} onCerrar={() => setAbierto(null)} onResuelto={cargar} />}
    </section>
  );
}

export default PagosAdminPage;
