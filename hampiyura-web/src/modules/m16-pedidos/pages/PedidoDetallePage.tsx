import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import {
  obtenerPedido, informarPago, confirmarPagoPedido, rechazarPagoPedido, marcarEnviado, confirmarRecepcion, abrirReclamo, resolverReclamo, cancelarPedido,
  ETIQUETA_ESTADO_PEDIDO, type PedidoDetalle,
} from '../api/pedidos.api';
import { subirMedia, leerArchivoComoBase64 } from '../../m06-publicaciones/api/publicaciones.api';
import Button from '../../../shared/ui/Button';
import Badge, { type BadgeVariant } from '../../../shared/ui/Badge';
import LoadingState from '../../../shared/ui/LoadingState';
import ErrorState from '../../../shared/ui/ErrorState';
import RequireRole from '../../../shared/auth/RequireRole';

const VARIANTE: Record<PedidoDetalle['estado'], BadgeVariant> = {
  PendientePago: 'warning', PagoInformado: 'info', PagoRechazado: 'danger', PagoConfirmado: 'info', Enviado: 'info', Recibido: 'success', Reclamo: 'danger', Cerrado: 'neutral', Cancelado: 'neutral',
};
const fecha = (s?: string) => (s ? new Date(s).toLocaleString('es-PE') : '—');

// M-16 · Detalle de un pedido de compra directa: números de cobro (solo comprador/vendedor), acciones según el
// estado y el rol de quien mira, y la línea de tiempo. El contrato aceptado queda guardado tal cual en el pedido.
function PedidoDetallePage() {
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const [pedido, setPedido] = useState<PedidoDetalle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function cargar() { obtenerPedido(id).then(setPedido).catch((e) => setError(e instanceof Error ? e.message : 'No se pudo cargar el pedido.')); }
  useEffect(cargar, [id]);

  async function ejecutar(accion: () => Promise<void>) {
    setEnviando(true); setError(null);
    try { await accion(); cargar(); } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo completar la acción.'); }
    finally { setEnviando(false); }
  }

  if (error && !pedido) return <ErrorState description={error} />;
  if (!pedido) return <LoadingState label="Cargando pedido" />;
  const puede = (a: string) => pedido.acciones.includes(a);

  return (
    <section>
      <Button variant="ghost" onClick={() => navigate('/m16-pedidos')}>← Mis pedidos</Button>
      <h2>{pedido.productoNombre}</h2>
      <p className="comentario-meta">Pedido {pedido.id.slice(0, 8).toUpperCase()} · {pedido.rolDelSolicitante === 'comprador' ? `Vendedor: ${pedido.vendedorNombre}` : pedido.rolDelSolicitante === 'vendedor' ? `Comprador: ${pedido.compradorNombre}` : `${pedido.compradorNombre} → ${pedido.vendedorNombre}`}</p>
      <Badge variant={VARIANTE[pedido.estado]}>{ETIQUETA_ESTADO_PEDIDO[pedido.estado]}</Badge>
      {pedido.plazoVencido && pedido.estado === 'PagoConfirmado' && <p className="advertencia-no-verificado">⚠ Se venció el plazo de entrega ({fecha(pedido.fechaLimiteEntrega)}) y el vendedor todavía no lo marcó como enviado.</p>}

      <dl className="detalle-campos" style={{ maxWidth: 640, marginTop: '1rem' }}>
        <div><dt>Cantidad</dt><dd>{pedido.cantidad}</dd></div>
        <div><dt>Total</dt><dd>S/ {pedido.total.toFixed(2)}</dd></div>
        <div><dt>Entrega a</dt><dd>{pedido.entregaNombre} · {pedido.entregaTelefono} · {pedido.entregaDireccion}</dd></div>
        <div><dt>Plazo de entrega</dt><dd>{pedido.entregaDias} días{pedido.fechaLimiteEntrega ? ` (hasta el ${fecha(pedido.fechaLimiteEntrega)})` : ''}</dd></div>
        {pedido.metodoElegido && <div><dt>Método de pago</dt><dd>{pedido.metodoElegido}{pedido.numeroOperacion ? ` · N.º de operación: ${pedido.numeroOperacion}` : ''}</dd></div>}
        {pedido.comprobanteUrl && <div><dt>Comprobante</dt><dd><a href={pedido.comprobanteUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-accent-text)' }}>Ver comprobante</a></dd></div>}
        {pedido.motivoRechazoPago && <div><dt>Motivo del rechazo del pago</dt><dd>{pedido.motivoRechazoPago}</dd></div>}
        {pedido.notaEnvio && <div><dt>Nota de envío</dt><dd>{pedido.notaEnvio}</dd></div>}
        {pedido.motivoReclamo && <div><dt>Motivo del reclamo</dt><dd>{pedido.motivoReclamo}</dd></div>}
        {pedido.resolucion && <div><dt>Resolución</dt><dd>{pedido.resolucion}</dd></div>}
      </dl>

      {error && <p className="error-formulario">{error}</p>}

      <RequireRole permitido={() => true}>
        {pedido.cobro && (pedido.rolDelSolicitante === 'comprador') && (
          <div className="panel-comprar" style={{ marginTop: '1rem' }}>
            <h3>Cómo pagar</h3>
            {pedido.cobro.yape && <p>Yape: <strong>{pedido.cobro.yape}</strong></p>}
            {pedido.cobro.plin && <p>Plin: <strong>{pedido.cobro.plin}</strong></p>}
            {pedido.cobro.cuenta && <p>Cuenta: <strong>{pedido.cobro.cuenta}</strong></p>}
            <p className="comentario-meta">Envía el pago por uno de estos medios y sube abajo la captura del comprobante.</p>
          </div>
        )}

        {puede('informarPago') && <FormularioInformarPago pedidoId={pedido.id} medios={Object.keys(pedido.cobro ?? {})} onListo={cargar} enviando={enviando} setError={setError} />}
        {puede('cancelar') && <Button variant="ghost" disabled={enviando} onClick={() => ejecutar(() => cancelarPedido(pedido.id))}>Cancelar pedido</Button>}

        {puede('confirmarPago') && (
          <div className="panel-comprar" style={{ marginTop: '1rem' }}>
            <h3>El comprador dice que ya pagó</h3>
            <div style={{ display: 'flex', gap: '.6rem' }}>
              <Button variant="primary" disabled={enviando} onClick={() => ejecutar(() => confirmarPagoPedido(pedido.id))}>Sí, recibí el pago</Button>
              <RechazarPagoBoton pedidoId={pedido.id} enviando={enviando} onHecho={cargar} setError={setError} />
            </div>
          </div>
        )}
        {puede('marcarEnviado') && <FormularioEnviar pedidoId={pedido.id} enviando={enviando} onListo={cargar} setError={setError} />}
        {puede('confirmarRecepcion') && (
          <Button variant="primary" iconLeft={<CheckCircle2 size={16} aria-hidden="true" />} disabled={enviando} onClick={() => ejecutar(() => confirmarRecepcion(pedido.id))}>Ya recibí mi pedido</Button>
        )}
        {puede('abrirReclamo') && <FormularioReclamo pedidoId={pedido.id} enviando={enviando} onListo={cargar} setError={setError} />}
        {puede('resolverReclamo') && <FormularioResolucion pedidoId={pedido.id} enviando={enviando} onListo={cargar} setError={setError} />}
      </RequireRole>

      <h3 style={{ marginTop: '1.5rem' }}>Línea de tiempo</h3>
      <ul className="lista-simple">
        {pedido.eventos.map((e, i) => <li key={i}>{fecha(e.fecha)} — <strong>{ETIQUETA_ESTADO_PEDIDO[e.estado]}</strong>{e.nota ? `: ${e.nota}` : ''}</li>)}
      </ul>

      <details style={{ marginTop: '1rem' }}>
        <summary>Ver el contrato de compraventa aceptado</summary>
        <pre className="contrato-texto">{pedido.contratoTexto}</pre>
      </details>
    </section>
  );
}

function FormularioInformarPago({ pedidoId, medios, onListo, enviando, setError }: { pedidoId: string; medios: string[]; onListo: () => void; enviando: boolean; setError: (s: string | null) => void }) {
  // `medios` trae las claves crudas de pedido.cobro ("yape"/"plin"/"cuenta"); el backend espera el nombre capitalizado
  // exacto (Yape/Plin/Cuenta) igual que METODOS_COBRO. Bug real encontrado al probar el flujo completo: con un solo medio
  // el <select> no se mostraba y `metodo` se quedaba con la clave en minúscula, así que el pago se rechazaba siempre.
  const opciones = medios.map((m) => (m === 'yape' ? 'Yape' : m === 'plin' ? 'Plin' : 'Cuenta'));
  const [metodo, setMetodo] = useState(opciones[0] ?? 'Yape');
  const [comprobanteUrl, setComprobanteUrl] = useState(''); const [numeroOperacion, setNumeroOperacion] = useState('');
  const [subiendo, setSubiendo] = useState(false); const [enviandoLocal, setEnviandoLocal] = useState(false);
  async function elegirArchivo(e: ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0]; e.target.value = ''; if (!archivo) return;
    setSubiendo(true); setError(null);
    try { setComprobanteUrl((await subirMedia(archivo.name, await leerArchivoComoBase64(archivo))).url); }
    catch (err) { setError(err instanceof Error ? err.message : 'No se pudo subir la captura.'); }
    finally { setSubiendo(false); }
  }
  async function enviar(e: FormEvent) {
    e.preventDefault(); if (!comprobanteUrl) { setError('Sube la captura del comprobante de pago.'); return; }
    setEnviandoLocal(true); setError(null);
    try { await informarPago(pedidoId, metodo, comprobanteUrl, numeroOperacion.trim() || undefined); onListo(); }
    catch (err) { setError(err instanceof Error ? err.message : 'No se pudo enviar.'); }
    finally { setEnviandoLocal(false); }
  }
  return (
    <form onSubmit={enviar} className="formulario" style={{ maxWidth: 480, marginTop: '1rem' }}>
      <h3>Ya pagué: subir comprobante</h3>
      {opciones.length > 1 && (
        <label>Método usado
          <select value={metodo} onChange={(e) => setMetodo(e.target.value)}>{opciones.map((m) => <option key={m} value={m}>{m}</option>)}</select>
        </label>
      )}
      <label>Captura del comprobante
        <input type="file" accept="image/*" onChange={elegirArchivo} disabled={subiendo} required={!comprobanteUrl} />
      </label>
      {subiendo && <p className="comentario-meta">Subiendo…</p>}
      {comprobanteUrl && <img src={comprobanteUrl} alt="Comprobante" className="comprobante-preview" />}
      <label>Número de operación (opcional)
        <input type="text" value={numeroOperacion} onChange={(e) => setNumeroOperacion(e.target.value)} maxLength={40} />
      </label>
      <Button type="submit" variant="primary" loading={enviando || enviandoLocal} disabled={subiendo}>Enviar comprobante</Button>
    </form>
  );
}
function RechazarPagoBoton({ pedidoId, enviando, onHecho, setError }: { pedidoId: string; enviando: boolean; onHecho: () => void; setError: (s: string | null) => void }) {
  const [abierto, setAbierto] = useState(false); const [motivo, setMotivo] = useState(''); const [local, setLocal] = useState(false);
  if (!abierto) return <Button variant="secondary" disabled={enviando} onClick={() => setAbierto(true)}>No recibí el pago</Button>;
  return (
    <form className="formulario" style={{ display: 'inline-flex', gap: '.5rem', alignItems: 'flex-start' }} onSubmit={async (e) => {
      e.preventDefault(); setLocal(true); setError(null);
      try { await rechazarPagoPedido(pedidoId, motivo); onHecho(); } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo enviar.'); } finally { setLocal(false); }
    }}>
      <input type="text" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Motivo (ej. no llegó el monto)" required />
      <Button type="submit" variant="secondary" loading={local}>Rechazar pago</Button>
    </form>
  );
}
function FormularioEnviar({ pedidoId, enviando, onListo, setError }: { pedidoId: string; enviando: boolean; onListo: () => void; setError: (s: string | null) => void }) {
  const [nota, setNota] = useState(''); const [local, setLocal] = useState(false);
  return (
    <form className="formulario" style={{ maxWidth: 480, marginTop: '1rem' }} onSubmit={async (e) => {
      e.preventDefault(); setLocal(true); setError(null);
      try { await marcarEnviado(pedidoId, nota); onListo(); } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo enviar.'); } finally { setLocal(false); }
    }}>
      <label>Nota de envío (transporte, guía o cómo lo entregarás)
        <input type="text" value={nota} onChange={(e) => setNota(e.target.value)} required minLength={5} />
      </label>
      <Button type="submit" variant="primary" loading={enviando || local}>Marcar como enviado</Button>
    </form>
  );
}
function FormularioReclamo({ pedidoId, enviando, onListo, setError }: { pedidoId: string; enviando: boolean; onListo: () => void; setError: (s: string | null) => void }) {
  const [motivo, setMotivo] = useState(''); const [local, setLocal] = useState(false);
  return (
    <form className="formulario" style={{ maxWidth: 480, marginTop: '1rem' }} onSubmit={async (e) => {
      e.preventDefault(); setLocal(true); setError(null);
      try { await abrirReclamo(pedidoId, motivo); onListo(); } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo enviar.'); } finally { setLocal(false); }
    }}>
      <label>Motivo del reclamo
        <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={2} required minLength={10} />
      </label>
      <Button type="submit" variant="danger" loading={enviando || local}>Abrir reclamo</Button>
    </form>
  );
}
function FormularioResolucion({ pedidoId, enviando, onListo, setError }: { pedidoId: string; enviando: boolean; onListo: () => void; setError: (s: string | null) => void }) {
  const [resolucion, setResolucion] = useState(''); const [local, setLocal] = useState(false);
  return (
    <form className="formulario" style={{ maxWidth: 480, marginTop: '1rem' }} onSubmit={async (e) => {
      e.preventDefault(); setLocal(true); setError(null);
      try { await resolverReclamo(pedidoId, resolucion); onListo(); } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo enviar.'); } finally { setLocal(false); }
    }}>
      <label>Resolución del reclamo (qué se acordó con las partes)
        <textarea value={resolucion} onChange={(e) => setResolucion(e.target.value)} rows={2} required minLength={10} />
      </label>
      <Button type="submit" variant="primary" loading={enviando || local}>Cerrar reclamo</Button>
    </form>
  );
}

export default PedidoDetallePage;
