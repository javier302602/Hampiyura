import { FormEvent, useState } from 'react';
import { reportarComentario } from '../api/comunidad.api';

function ReportarComentarioForm({ comentarioId, onCerrar }: { comentarioId: string; onCerrar: () => void }) {
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  async function manejarSubmit(e: FormEvent) {
    e.preventDefault();
    if (!motivo.trim()) { setError('Indica el motivo del reporte.'); return; }
    setEnviando(true);
    setError(null);
    try {
      await reportarComentario(comentarioId, motivo.trim());
      setEnviado(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar el reporte.');
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) return <p className="comentario-meta">Reporte enviado. Un validador lo revisará.</p>;

  return (
    <form onSubmit={manejarSubmit} className="formulario" style={{ maxWidth: '360px' }}>
      <label>
        Motivo del reporte
        <input type="text" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej. contenido ofensivo, spam…" required />
      </label>
      {error && <p className="error-formulario">{error}</p>}
      <div style={{ display: 'flex', gap: '.5rem' }}>
        <button type="submit" disabled={enviando}>{enviando ? 'Enviando…' : 'Reportar'}</button>
        <button type="button" onClick={onCerrar}>Cancelar</button>
      </div>
    </form>
  );
}

export default ReportarComentarioForm;
