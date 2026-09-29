import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  obtenerContratoCultivo, aceptarContratoCultivo, rechazarContratoCultivo, informarAdelantoContratoCultivo, confirmarAdelantoContratoCultivo,
  rechazarAdelantoContratoCultivo, marcarCompletadoContratoCultivo, cancelarContratoCultivo, ETIQUETA_ESTADO_CONTRATO_CULTIVO,
  type ContratoCultivoDetalle, type MetodoCobroCultivo,
} from '../api/contratos-cultivo.api';
import { subirMedia, leerArchivoComoBase64 } from '../../m06-publicaciones/api/publicaciones.api';
import Button from '../../../shared/ui/Button';
import Badge, { type BadgeVariant } from '../../../shared/ui/Badge';
import LoadingState from '../../../shared/ui/LoadingState';
import ErrorState from '../../../shared/ui/ErrorState';
import RequireRole from '../../../shared/auth/RequireRole';

const VARIANTE: Record<ContratoCultivoDetalle['estado'], BadgeVariant> = {
  Propuesto: 'warning', Rechazado: 'neutral', AdelantoPendiente: 'info', EnCurso: 'info', Completado: 'success', Cancelado: 'neutral',
};
const fecha = (s?: string) => (s ? new Date(s).toLocaleString('es-PE') : '—');

// M-17 · Detalle de un contrato de compra directa de cosecha: sigue siendo una hipótesis de flujo, sin validar
// con un agricultor o comprador real -- sirve para probar el proceso completo (propuesta, aceptación, adelanto,
// confirmación y liquidación final), no como una funcionalidad ya verificada en campo.
function ContratoCultivoDetallePage() {
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const [contrato, setContrato] = useState<ContratoCultivoDetalle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function cargar() { obtenerContratoCultivo(id).then(setContrato).catch((e) => setError(e instanceof Error ? e.message : 'No se pudo cargar el contrato.')); }
  useEffect(cargar, [id]);

  async function ejecutar(accion: () => Promise<void>) {
    setEnviando(true); setError(null);
    try { await accion(); cargar(); } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo completar la acción.'); }
    finally { setEnviando(false); }
  }

  if (error && !contrato) return <ErrorState description={error} />;
  if (!contrato) return <LoadingState label="Cargando contrato" />;
  const puede = (a: string) => contrato.acciones.includes(a);

  return (
    <section>
      <Button variant="ghost" onClick={() => navigate('/m17-compra-cultivo')}>← Mis contratos de cultivo</Button>
      <h2>{contrato.plantaNombre}</h2>
      <p className="comentario-meta">
        Contrato {contrato.id.slice(0, 8).toUpperCase()} · {contrato.rolDelSolicitante === 'comprador' ? `Agricultor: ${contrato.agricultorNombre}` : contrato.rolDelSolicitante === 'agricultor' ? `Comprador: ${contrato.compradorNombre}` : `${contrato.compradorNombre} → ${contrato.agricultorNombre}`}
      </p>
      <Badge variant={VARIANTE[contrato.estado]}>{ETIQUETA_ESTADO_CONTRATO_CULTIVO[contrato.estado]}</Badge>

      <dl className="detalle-campos" style={{ maxWidth: 640, marginTop: '1rem' }}>
        <div><dt>Cantidad</dt><dd>{contrato.cantidad}</dd></div>
        <div><dt>Monto acordado</dt><dd>S/ {contrato.montoAcordado.toFixed(2)}</dd></div>
        <div><dt>Adelanto (50%)</dt><dd>S/ {contrato.montoAdelanto.toFixed(2)}</dd></div>
        <div><dt>Saldo (directo al recibir, 50%)</dt><dd>S/ {contrato.montoSaldo.toFixed(2)}</dd></div>
        <div><dt>Comisión de HampiYura (3%, la paga el agricultor)</dt><dd>S/ {contrato.comisionReferencial.toFixed(2)}</dd></div>
        <div><dt>Neto para el agricultor</dt><dd>S/ {contrato.netoAgricultor.toFixed(2)}</dd></div>
        {contrato.mensajeComprador && <div><dt>Mensaje del comprador</dt><dd>{contrato.mensajeComprador}</dd></div>}
        {contrato.cobroMedio && <div><dt>Cómo pagar el adelanto</dt><dd>{contrato.cobroMedio}: {contrato.cobroNumero}</dd></div>}
        {contrato.comprobanteAdelantoUrl && <div><dt>Comprobante del adelanto</dt><dd><a href={contrato.comprobanteAdelantoUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-accent-text)' }}>Ver comprobante</a>{contrato.numeroOperacionAdelanto ? ` · N.º de operación: ${contrato.numeroOperacionAdelanto}` : ''}</dd></div>}
        {contrato.motivoRechazo && <div><dt>Motivo del rechazo</dt><dd>{contrato.motivoRechazo}</dd></div>}
        {contrato.motivoRechazoAdelanto && <div><dt>Motivo del rechazo del adelanto</dt><dd>{contrato.motivoRechazoAdelanto}</dd></div>}
      </dl>

      {error && <p className="error-formulario">{error}</p>}

      <RequireRole permitido={() => true}>
        {puede('aceptar') && <FormularioAceptar contratoId={contrato.id} montoAdelanto={contrato.montoAdelanto} enviando={enviando} onListo={cargar} setError={setError} />}
        {puede('rechazar') && <FormularioMotivo titulo="Rechazar propuesta" etiquetaBoton="Rechazar" variante="danger" minLength={5} onEnviar={(m) => ejecutar(() => rechazarContratoCultivo(contrato.id, m))} enviando={enviando} />}
        {puede('cancelar') && <Button variant="ghost" disabled={enviando} onClick={() => ejecutar(() => cancelarContratoCultivo(contrato.id))}>Cancelar propuesta</Button>}
        {puede('informarAdelanto') && <FormularioInformarAdelanto contratoId={contrato.id} enviando={enviando} onListo={cargar} setError={setError} />}
        {puede('confirmarAdelanto') && (
          <div className="panel-comprar" style={{ marginTop: '1rem' }}>
            <h3>El comprador dice que ya pagó el adelanto</h3>
            <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap' }}>
              <Button variant="primary" disabled={enviando} onClick={() => ejecutar(() => confirmarAdelantoContratoCultivo(contrato.id))}>Sí, recibí el adelanto</Button>
            </div>
            <div style={{ marginTop: '.6rem' }}>
              <FormularioMotivo titulo="" etiquetaBoton="No recibí el adelanto" variante="secondary" minLength={5} onEnviar={(m) => ejecutar(() => rechazarAdelantoContratoCultivo(contrato.id, m))} enviando={enviando} colapsable />
            </div>
          </div>
        )}
        {puede('marcarCompletado') && (
          <div className="panel-comprar" style={{ marginTop: '1rem' }}>
            <h3>Entregar la cosecha</h3>
            <p className="comentario-meta">Marca esto cuando ya entregaste la cosecha y recibiste el saldo (S/ {contrato.montoSaldo.toFixed(2)}) directamente del comprador.</p>
            <Button variant="primary" disabled={enviando} onClick={() => ejecutar(() => marcarCompletadoContratoCultivo(contrato.id))}>Marcar como completado</Button>
          </div>
        )}
      </RequireRole>

      <h3 style={{ marginTop: '1.5rem' }}>Línea de tiempo</h3>
      <ul className="lista-simple">
        {contrato.eventos.map((e, i) => <li key={i}>{fecha(e.fecha)} — <strong>{ETIQUETA_ESTADO_CONTRATO_CULTIVO[e.estado]}</strong>{e.nota ? `: ${e.nota}` : ''}</li>)}
      </ul>
    </section>
  );
}

function FormularioAceptar({ contratoId, montoAdelanto, enviando, onListo, setError }: { contratoId: string; montoAdelanto: number; enviando: boolean; onListo: () => void; setError: (s: string | null) => void }) {
  const [medio, setMedio] = useState<MetodoCobroCultivo>('Yape');
  const [numero, setNumero] = useState('');
  const [local, setLocal] = useState(false);
  return (
    <form className="formulario" style={{ maxWidth: 420, marginTop: '1rem' }} onSubmit={async (e) => {
      e.preventDefault(); setLocal(true); setError(null);
      try { await aceptarContratoCultivo(contratoId, medio, numero); onListo(); } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo aceptar.'); } finally { setLocal(false); }
    }}>
      <h3>Aceptar la propuesta</h3>
      <p className="comentario-meta" style={{ marginTop: 0 }}>Al aceptar, el comprador te pagará un adelanto de S/ {montoAdelanto.toFixed(2)} por el medio que elijas aquí.</p>
      <label>Medio de cobro del adelanto
        <select value={medio} onChange={(e) => setMedio(e.target.value as MetodoCobroCultivo)}>
          <option value="Yape">Yape</option><option value="Plin">Plin</option><option value="Cuenta">Cuenta bancaria</option>
        </select>
      </label>
      <label>Número {medio === 'Cuenta' ? '(banco y número o CCI)' : '(celular)'}
        <input type="text" value={numero} onChange={(e) => setNumero(e.target.value)} required />
      </label>
      <Button type="submit" variant="primary" loading={enviando || local}>Aceptar y dar mi cobro</Button>
    </form>
  );
}

function FormularioInformarAdelanto({ contratoId, enviando, onListo, setError }: { contratoId: string; enviando: boolean; onListo: () => void; setError: (s: string | null) => void }) {
  const [comprobanteUrl, setComprobanteUrl] = useState(''); const [numeroOperacion, setNumeroOperacion] = useState('');
  const [subiendo, setSubiendo] = useState(false); const [local, setLocal] = useState(false);
  async function elegirArchivo(e: ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0]; e.target.value = ''; if (!archivo) return;
    setSubiendo(true); setError(null);
    try { setComprobanteUrl((await subirMedia(archivo.name, await leerArchivoComoBase64(archivo))).url); }
    catch (err) { setError(err instanceof Error ? err.message : 'No se pudo subir la captura.'); }
    finally { setSubiendo(false); }
  }
  async function enviar(e: FormEvent) {
    e.preventDefault(); if (!comprobanteUrl) { setError('Sube la captura del comprobante del adelanto.'); return; }
    setLocal(true); setError(null);
    try { await informarAdelantoContratoCultivo(contratoId, comprobanteUrl, numeroOperacion.trim() || undefined); onListo(); }
    catch (err) { setError(err instanceof Error ? err.message : 'No se pudo enviar.'); } finally { setLocal(false); }
  }
  return (
    <form onSubmit={enviar} className="formulario" style={{ maxWidth: 420, marginTop: '1rem' }}>
      <h3>Ya pagué el adelanto: subir comprobante</h3>
      <label>Captura del comprobante
        <input type="file" accept="image/*" onChange={elegirArchivo} disabled={subiendo} required={!comprobanteUrl} />
      </label>
      {subiendo && <p className="comentario-meta">Subiendo…</p>}
      {comprobanteUrl && <img src={comprobanteUrl} alt="Comprobante" className="comprobante-preview" />}
      <label>Número de operación (opcional)
        <input type="text" value={numeroOperacion} onChange={(e) => setNumeroOperacion(e.target.value)} maxLength={40} />
      </label>
      <Button type="submit" variant="primary" loading={enviando || local} disabled={subiendo}>Enviar comprobante</Button>
    </form>
  );
}

function FormularioMotivo({ titulo, etiquetaBoton, variante, minLength, onEnviar, enviando, colapsable }: {
  titulo: string; etiquetaBoton: string; variante: 'danger' | 'secondary'; minLength: number; onEnviar: (motivo: string) => void; enviando: boolean; colapsable?: boolean;
}) {
  const [abierto, setAbierto] = useState(!colapsable);
  const [motivo, setMotivo] = useState('');
  if (!abierto) return <Button variant="secondary" disabled={enviando} onClick={() => setAbierto(true)}>{etiquetaBoton}</Button>;
  return (
    <form className="formulario" style={{ maxWidth: 420, marginTop: colapsable ? 0 : '1rem' }} onSubmit={(e) => { e.preventDefault(); onEnviar(motivo); }}>
      {titulo && <h3>{titulo}</h3>}
      <label>Motivo
        <input type="text" value={motivo} onChange={(e) => setMotivo(e.target.value)} required minLength={minLength} />
      </label>
      <Button type="submit" variant={variante} loading={enviando}>{etiquetaBoton}</Button>
    </form>
  );
}

export default ContratoCultivoDetallePage;
