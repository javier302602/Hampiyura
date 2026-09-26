import { FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Send } from 'lucide-react';
import { listarConversaciones, obtenerConversacion, responderConversacion, MAX_CARACTERES_MENSAJE, type ConversacionDetalle, type ConversacionResumen } from '../api/extras.api';
import { RUTAS_M15 } from '../api/planes.api';
import RequireRole from '../../../shared/auth/RequireRole';
import Button from '../../../shared/ui/Button';
import Badge from '../../../shared/ui/Badge';
import SectionHeader from '../../../shared/ui/SectionHeader';
import LoadingState from '../../../shared/ui/LoadingState';
import ErrorState from '../../../shared/ui/ErrorState';
import EmptyState from '../../../shared/ui/EmptyState';

const hora = (s: string) => new Date(s).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });

// Mensajes directos (plan Negocio): el comprador con plan escribe a un productor contactable desde la ficha del productor; el productor
// responde aquí. Solo los dos participantes ven la conversación. No se comparte ningún dato personal automáticamente.
function MensajesPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const activaId = params.get('c');
  const [lista, setLista] = useState<ConversacionResumen[] | null>(null);
  const [detalle, setDetalle] = useState<ConversacionDetalle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const finRef = useRef<HTMLDivElement>(null);

  const cargarLista = () => listarConversaciones().then(setLista).catch((e) => setError(e instanceof Error ? e.message : 'No se pudieron cargar tus mensajes.'));
  useEffect(() => { cargarLista(); }, []);
  useEffect(() => {
    if (!activaId) { setDetalle(null); return; }
    obtenerConversacion(activaId).then((d) => { setDetalle(d); cargarLista(); }).catch((e) => setError(e instanceof Error ? e.message : 'No se pudo abrir la conversación.'));
  }, [activaId]);
  useEffect(() => { finRef.current?.scrollIntoView?.({ block: 'end' }); }, [detalle?.mensajes.length]);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!activaId || !texto.trim() || enviando) return;
    setEnviando(true); setErrorEnvio(null);
    try { await responderConversacion(activaId, texto); setTexto(''); setDetalle(await obtenerConversacion(activaId)); cargarLista(); }
    catch (err) { setErrorEnvio(err instanceof Error ? err.message : 'No se pudo enviar el mensaje.'); }
    finally { setEnviando(false); }
  }

  return (
    <section>
      <SectionHeader eyebrow="Plan Negocio" title="Mensajes" description="Conversaciones directas dentro de la plataforma entre compradores con plan y productores. Solo las ven las dos personas que conversan."
        action={<Button variant="secondary" onClick={() => navigate(RUTAS_M15.productores)}>Ver productores</Button>} />
      <RequireRole permitido={() => true}>
        {error && <ErrorState description={error} />}
        {!lista && !error && <LoadingState label="Cargando mensajes" />}
        {lista && lista.length === 0 && (
          <EmptyState title="Todavía no tienes conversaciones" description="Con un plan Negocio (o superior) puedes escribirle a un productor desde su ficha en el directorio. Si eres productor, aquí verás los mensajes que te lleguen."
            action={<Button variant="primary" onClick={() => navigate(RUTAS_M15.productores)}>Ir al directorio de productores</Button>} />
        )}
        {lista && lista.length > 0 && (
          <div className="mensajes-layout">
            <ul className="mensajes-lista" aria-label="Tus conversaciones">
              {lista.map((c) => (
                <li key={c.id}>
                  <button type="button" className={`mensajes-fila${c.id === activaId ? ' mensajes-fila-activa' : ''}`} onClick={() => setParams({ c: c.id })}>
                    <strong>{c.conNombre}</strong>
                    <span className="comentario-meta">{c.conTipo === 'productor' ? 'Productor' : 'Comprador'}{c.sinLeer > 0 && <> · <Badge variant="accent">{c.sinLeer} sin leer</Badge></>}</span>
                    {c.ultimoMensaje && <span className="mensajes-vista">{c.ultimoMensaje.propio ? 'Tú: ' : ''}{c.ultimoMensaje.texto}</span>}
                  </button>
                </li>
              ))}
            </ul>
            <div className="mensajes-hilo">
              {!detalle && <p className="comentario-meta">Elige una conversación de la lista.</p>}
              {detalle && (
                <>
                  <h3 className="mensajes-titulo">{detalle.conNombre}</h3>
                  <div className="mensajes-cuerpo" role="log" aria-label={`Conversación con ${detalle.conNombre}`}>
                    {detalle.mensajes.map((m) => (
                      <div key={m.id} className={`mensaje ${m.propio ? 'mensaje-propio' : 'mensaje-ajeno'}`}>
                        <p>{m.texto}</p>
                        <span className="comentario-meta">{hora(m.creadoEn)}{m.propio && m.leido ? ' · leído' : ''}</span>
                      </div>
                    ))}
                    <div ref={finRef} />
                  </div>
                  {detalle.puedeResponder ? (
                    <form className="mensajes-form" onSubmit={enviar}>
                      <label className="sr-only" htmlFor="mensaje-texto">Tu mensaje</label>
                      <textarea id="mensaje-texto" value={texto} maxLength={MAX_CARACTERES_MENSAJE} rows={2} placeholder="Escribe tu mensaje…" onChange={(e) => setTexto(e.target.value)} />
                      <Button type="submit" variant="primary" iconLeft={<Send size={15} aria-hidden="true" />} disabled={enviando || !texto.trim()}>Enviar</Button>
                      {errorEnvio && <p className="error-formulario" role="alert">{errorEnvio}</p>}
                    </form>
                  ) : (
                    <p className="filtros-bloqueados" role="note"><Lock size={15} aria-hidden="true" /> {detalle.motivoBloqueo} <button type="button" className="enlace-plan" onClick={() => navigate(RUTAS_M15.planes)}>Ver planes</button></p>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </RequireRole>
    </section>
  );
}

export default MensajesPage;
