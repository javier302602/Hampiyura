import { useEffect, useState } from 'react';
import { CheckCircle2, MessageSquareWarning, XCircle } from 'lucide-react';
import { obtenerDetalle, type DetalleValidacion } from '../api/validaciones.api';
import Modal from '../../../shared/ui/Modal';
import Button from '../../../shared/ui/Button';
import MiniMapaUbicacion from '../../m03-cultivo/components/MiniMapaUbicacion';

interface Props {
  validacionId: string;
  onCerrar: () => void;
  // Cada acción devuelve una promesa: si falla, el mensaje real del backend se muestra dentro del modal.
  onAprobar: (id: string) => Promise<void>;
  onObservar: (id: string, comentario: string) => Promise<void>;
  onRechazar: (id: string, comentario: string) => Promise<void>;
}

function Campos({ campos }: { campos: { etiqueta: string; valor: string }[] }) {
  return (
    <dl className="detalle-campos">
      {campos.map((c) => (
        <div key={c.etiqueta}><dt>{c.etiqueta}</dt><dd>{c.valor}</dd></div>
      ))}
    </dl>
  );
}

// Vista de detalle de la bandeja de M-09: muestra TODO lo que envió quien propuso el contenido y deja ahí
// las tres decisiones. "Observar" y "Rechazar" exigen un motivo (el backend lo pide), que se escribe aquí
// mismo en vez de en un cuadro emergente del navegador.
function DetalleValidacionModal({ validacionId, onCerrar, onAprobar, onObservar, onRechazar }: Props) {
  const [detalle, setDetalle] = useState<DetalleValidacion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [decision, setDecision] = useState<'observar' | 'rechazar' | null>(null);
  const [motivo, setMotivo] = useState('');
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    obtenerDetalle(validacionId).then(setDetalle).catch((e) => setError(e instanceof Error ? e.message : 'No se pudo cargar el detalle.'));
  }, [validacionId]);

  async function ejecutar(fn: () => Promise<void>) {
    setProcesando(true);
    setError(null);
    try { await fn(); onCerrar(); }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudo completar la acción.'); }
    finally { setProcesando(false); }
  }

  const pie = detalle && (
    <>
      {decision && (
        <label style={{ display: 'grid', gap: 'var(--space-1)', fontWeight: 600 }}>
          {decision === 'observar' ? 'Motivo de la observación (se le pide una corrección a quien lo envió)' : 'Motivo del rechazo'}
          <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={3} autoFocus required />
        </label>
      )}
      {error && <p className="error-formulario" role="alert">{error}</p>}
      <div className="modal-pie-acciones">
        {!decision ? (
          <>
            <Button variant="primary" loading={procesando} iconLeft={<CheckCircle2 size={16} aria-hidden="true" />} onClick={() => ejecutar(() => onAprobar(validacionId))}>Aprobar</Button>
            <Button variant="secondary" iconLeft={<MessageSquareWarning size={16} aria-hidden="true" />} onClick={() => { setDecision('observar'); setMotivo(''); setError(null); }}>Observar</Button>
            <Button variant="danger" iconLeft={<XCircle size={16} aria-hidden="true" />} onClick={() => { setDecision('rechazar'); setMotivo(''); setError(null); }}>Rechazar</Button>
          </>
        ) : (
          <>
            <Button
              variant={decision === 'rechazar' ? 'danger' : 'primary'} loading={procesando} disabled={!motivo.trim()}
              onClick={() => ejecutar(() => (decision === 'observar' ? onObservar(validacionId, motivo.trim()) : onRechazar(validacionId, motivo.trim())))}
            >
              {decision === 'observar' ? 'Enviar observación' : 'Confirmar rechazo'}
            </Button>
            <Button variant="ghost" onClick={() => { setDecision(null); setError(null); }}>Volver</Button>
          </>
        )}
      </div>
    </>
  );

  return (
    <Modal titulo={detalle ? detalle.etiqueta : 'Detalle del contenido'} onCerrar={onCerrar} pie={pie}>
      {!detalle && !error && <p>Cargando detalle…</p>}
      {!detalle && error && <p className="error-formulario" role="alert">{error}</p>}
      {detalle && (
        <>
          <div className="detalle-meta">
            <span className="badge badge-estado">{detalle.tipoEntidad}</span>
            <span className="badge badge-estado">{detalle.estado}</span>
            <p>Enviado por <strong>{detalle.autorNombre}</strong> · {new Date(detalle.fecha).toLocaleString()}</p>
          </div>
          {detalle.imagenes.length > 0 && (
            <div className="detalle-imagenes">
              {detalle.imagenes.map((url) => <a key={url} href={url} target="_blank" rel="noopener noreferrer"><img src={url} alt="Imagen enviada" /></a>)}
            </div>
          )}
          <Campos campos={detalle.campos} />
          {detalle.ubicacion && (
            <div>
              <p className="comentario-meta">Ubicación marcada: {detalle.ubicacion.latitud.toFixed(5)}, {detalle.ubicacion.longitud.toFixed(5)} (solo visible para quien valida)</p>
              <MiniMapaUbicacion latitud={detalle.ubicacion.latitud} longitud={detalle.ubicacion.longitud} etiqueta={detalle.etiqueta} />
            </div>
          )}
          {detalle.relacionados.map((r) => (
            <section key={r.titulo + r.campos.length} className="detalle-relacionado">
              <h3>{r.titulo}</h3>
              <p className="comentario-meta">Se aprueba por separado, desde su propia tarjeta de la bandeja.</p>
              <Campos campos={r.campos} />
            </section>
          ))}
        </>
      )}
    </Modal>
  );
}

export default DetalleValidacionModal;
