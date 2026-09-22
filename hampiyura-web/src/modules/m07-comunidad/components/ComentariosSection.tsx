import { FormEvent, useEffect, useState } from 'react';
import { listarComentarios, comentarPublicacion, type Comentario } from '../api/comunidad.api';
import ReportarComentarioForm from './ReportarComentarioForm';
import RequireRole from '../../../shared/auth/RequireRole';

function FormularioComentario({ onEnviar, placeholder, textoBoton }: { onEnviar: (texto: string) => Promise<void>; placeholder: string; textoBoton: string }) {
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function manejarSubmit(e: FormEvent) {
    e.preventDefault();
    if (!texto.trim()) { setError('El comentario no puede estar vacío.'); return; }
    setEnviando(true);
    setError(null);
    try {
      await onEnviar(texto.trim());
      setTexto('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar el comentario.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={manejarSubmit} className="formulario">
      <label>
        {placeholder}
        <textarea value={texto} onChange={(e) => setTexto(e.target.value)} required />
      </label>
      {error && <p className="error-formulario">{error}</p>}
      <button type="submit" disabled={enviando}>{enviando ? 'Enviando…' : textoBoton}</button>
    </form>
  );
}

function BotonReportar({ comentarioId }: { comentarioId: string }) {
  const [mostrarReporte, setMostrarReporte] = useState(false);
  return (
    <>
      <button onClick={() => setMostrarReporte((v) => !v)}>{mostrarReporte ? 'Cancelar' : 'Reportar'}</button>
      {mostrarReporte && <ReportarComentarioForm comentarioId={comentarioId} onCerrar={() => setMostrarReporte(false)} />}
    </>
  );
}

function ComentarioItem({ comentario, respuestas, onResponder }: { comentario: Comentario; respuestas: Comentario[]; onResponder: (padreId: string, texto: string) => Promise<void> }) {
  const [mostrarRespuesta, setMostrarRespuesta] = useState(false);

  return (
    <div className="comentario">
      <strong>{comentario.autorNombre}</strong>
      <p style={{ margin: '.2em 0' }}>{comentario.texto}</p>
      <span className="comentario-meta">{new Date(comentario.fecha).toLocaleString()}</span>
      <RequireRole permitido={() => true}>
        <div className="comentario-acciones">
          <button onClick={() => setMostrarRespuesta((v) => !v)}>{mostrarRespuesta ? 'Cancelar' : 'Responder'}</button>
          <BotonReportar comentarioId={comentario.id} />
        </div>
      </RequireRole>
      {mostrarRespuesta && (
        <FormularioComentario
          placeholder="Tu respuesta"
          textoBoton="Responder"
          onEnviar={async (texto) => { await onResponder(comentario.id, texto); setMostrarRespuesta(false); }}
        />
      )}
      {respuestas.map((r) => (
        <div key={r.id} className="respuesta comentario">
          <strong>{r.autorNombre}</strong>
          <p style={{ margin: '.2em 0' }}>{r.texto}</p>
          <span className="comentario-meta">{new Date(r.fecha).toLocaleString()}</span>
          <RequireRole permitido={() => true}>
            <div className="comentario-acciones">
              <BotonReportar comentarioId={r.id} />
            </div>
          </RequireRole>
        </div>
      ))}
    </div>
  );
}

function ComentariosSection({ publicacionId }: { publicacionId: string }) {
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function cargar() {
    setCargando(true);
    listarComentarios(publicacionId).then(setComentarios).catch(() => setError('No se pudieron cargar los comentarios.')).finally(() => setCargando(false));
  }

  useEffect(cargar, [publicacionId]);

  async function enviarComentario(texto: string) { await comentarPublicacion(publicacionId, texto); cargar(); }
  async function enviarRespuesta(padreId: string, texto: string) { await comentarPublicacion(publicacionId, texto, padreId); cargar(); }

  const raiz = comentarios.filter((c) => !c.comentarioPadreId);

  return (
    <section style={{ marginTop: '1.5rem' }}>
      <h3>Comentarios</h3>
      {cargando && <p>Cargando comentarios…</p>}
      {error && <p>{error}</p>}
      {!cargando && !error && raiz.length === 0 && <p>Todavía no hay comentarios en esta publicación.</p>}
      {!cargando && !error && raiz.map((c) => (
        <ComentarioItem
          key={c.id}
          comentario={c}
          respuestas={comentarios.filter((r) => r.comentarioPadreId === c.id)}
          onResponder={enviarRespuesta}
        />
      ))}

      <RequireRole permitido={() => true}>
        <FormularioComentario placeholder="Escribe un comentario" textoBoton="Comentar" onEnviar={enviarComentario} />
      </RequireRole>
    </section>
  );
}

export default ComentariosSection;
