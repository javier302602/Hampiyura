import { FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Send, X, UserRound } from 'lucide-react';
import { consultarAsistente, estadoAsistente, type EstadoAsistente, type RespuestaAsistente } from '../api/asistente.api';

interface Mensaje { rol: 'user' | 'assistant'; texto: string; respuesta?: RespuestaAsistente; error?: boolean }

const SUGERENCIAS = ['¿Cómo propongo una planta nueva?', '¿Qué planta sirve para el dolor de estómago?', '¿Cómo funciona el directorio de productores?'];

// Asistente de ayuda de HampiYura: chat flotante, disponible con o sin cuenta. La conversación vive SOLO en la memoria del navegador
// (mientras la página siga abierta): no se guarda en el servidor. Las respuestas sobre plantas salen únicamente de lo validado en la
// base; si no hay dato, ofrece enviar la pregunta a un especialista con el texto ya precargado.
function AsistenteChat() {
  const navigate = useNavigate();
  const [abierto, setAbierto] = useState(false);
  const [estado, setEstado] = useState<EstadoAsistente | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const finRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (abierto && !estado) estadoAsistente().then(setEstado).catch(() => setEstado({ activo: false, simulado: false })); }, [abierto, estado]);
  useEffect(() => { finRef.current?.scrollIntoView?.({ block: 'end' }); }, [mensajes, enviando, abierto]);

  function irAConsulta(pregunta: string) {
    setAbierto(false);
    navigate(`/m08-consultas/nueva?texto=${encodeURIComponent(pregunta)}`);
  }

  async function enviar(pregunta: string) {
    const p = pregunta.trim();
    if (!p || enviando) return;
    const historial = mensajes.filter((m) => !m.error).slice(-6).map((m) => ({ rol: m.rol, contenido: m.texto }));
    setMensajes((prev) => [...prev, { rol: 'user', texto: p }]);
    setTexto(''); setEnviando(true);
    try {
      const r = await consultarAsistente(p, historial);
      setMensajes((prev) => [...prev, { rol: 'assistant', texto: r.respuesta, respuesta: r }]);
    } catch (err) {
      setMensajes((prev) => [...prev, { rol: 'assistant', texto: err instanceof Error ? err.message : 'No pude responder ahora.', error: true, respuesta: { respuesta: '', escalar: true, consultaSugerida: p, fuentes: [], modo: 'sin-modelo' } }]);
    } finally { setEnviando(false); }
  }
  function alEnviar(e: FormEvent) { e.preventDefault(); enviar(texto); }

  const apagado = estado !== null && !estado.activo;

  return (
    <div className="asistente">
      {!abierto && (
        <button type="button" className="asistente-boton" onClick={() => setAbierto(true)} aria-label="Abrir el asistente de ayuda">
          <Bot size={22} aria-hidden="true" /> <span>Asistente</span>
        </button>
      )}
      {abierto && (
        <section className="asistente-panel" role="dialog" aria-label="Asistente de HampiYura" aria-modal="false">
          <header className="asistente-cabecera">
            <span className="asistente-titulo"><Bot size={20} aria-hidden="true" /> Asistente de HampiYura</span>
            <button type="button" className="asistente-cerrar" onClick={() => setAbierto(false)} aria-label="Cerrar el asistente"><X size={20} aria-hidden="true" /></button>
          </header>

          <div className="asistente-aviso" role="note">
            <strong>Soy un asistente automático, no una persona.</strong> Mis respuestas sobre plantas se basan solo en lo que ya está validado en HampiYura; si no tengo el dato, te lo digo. Los usos <strong>Tradicionales o Documentados son sugerencias no verificadas</strong> científicamente.
            {estado?.simulado && <span className="asistente-simulado"> Modo simulado: sin proveedor de IA conectado.</span>}
          </div>

          <div className="asistente-mensajes" role="log" aria-live="polite" aria-label="Conversación con el asistente">
            {mensajes.length === 0 && !apagado && (
              <div className="asistente-inicio">
                <p>Puedo ayudarte a usar la plataforma o buscar entre las plantas ya validadas. Prueba con:</p>
                <div className="asistente-sugerencias">
                  {SUGERENCIAS.map((s) => <button key={s} type="button" onClick={() => enviar(s)}>{s}</button>)}
                </div>
              </div>
            )}
            {apagado && (
              <div className="asistente-msg asistente-msg-bot">
                <p>El asistente no está disponible por ahora. Puedes enviar tu pregunta directamente a un especialista.</p>
                <button type="button" className="asistente-escalar" onClick={() => irAConsulta(texto)}><UserRound size={16} aria-hidden="true" /> Enviar una consulta a un especialista</button>
              </div>
            )}
            {mensajes.map((m, i) => (
              <div key={i} className={`asistente-msg ${m.rol === 'user' ? 'asistente-msg-yo' : 'asistente-msg-bot'}${m.error ? ' asistente-msg-error' : ''}`}>
                <span className="asistente-quien">{m.rol === 'user' ? 'Tú' : 'Asistente'}</span>
                <p>{m.texto}</p>
                {m.respuesta && m.rol === 'assistant' && (
                  <>
                    {m.respuesta.fuentes.length > 0 && <p className="asistente-fuentes">Basado en: {m.respuesta.fuentes.map((f) => `${f.planta} (${f.tipos.join(', ')})`).join(' · ')}</p>}
                    {(m.respuesta.escalar || m.respuesta.modo === 'sin-modelo') && (
                      <button type="button" className="asistente-escalar" onClick={() => irAConsulta(m.respuesta!.consultaSugerida)}><UserRound size={16} aria-hidden="true" /> Enviar mi pregunta a un especialista</button>
                    )}
                  </>
                )}
              </div>
            ))}
            {enviando && <div className="asistente-msg asistente-msg-bot" aria-live="polite"><p>Buscando en lo validado…</p></div>}
            <div ref={finRef} />
          </div>

          {mensajes.length > 0 && !apagado && <button type="button" className="asistente-enlace" onClick={() => irAConsulta(mensajes.filter((m) => m.rol === 'user').slice(-1)[0]?.texto ?? '')}>¿Prefieres hablar con un especialista? Enviar consulta</button>}

          <form className="asistente-form" onSubmit={alEnviar}>
            <label className="sr-only" htmlFor="asistente-texto">Tu pregunta</label>
            <input id="asistente-texto" type="text" value={texto} maxLength={500} onChange={(e) => setTexto(e.target.value)} placeholder="Escribe tu pregunta…" disabled={enviando || apagado} autoComplete="off" />
            <button type="submit" className="asistente-enviar" disabled={enviando || apagado || !texto.trim()} aria-label="Enviar pregunta"><Send size={18} aria-hidden="true" /></button>
          </form>
        </section>
      )}
    </div>
  );
}

export default AsistenteChat;
