import { FormEvent, useState } from 'react';
import { reportarComentario } from '../api/comunidad.api';
import { CATEGORIAS_REPORTE, type CategoriaReporte } from '../../m09-validacion-moderacion/api/reportes.api';

function ReportarComentarioForm({ comentarioId, onCerrar }: { comentarioId: string; onCerrar: () => void }) {
  const [categoria, setCategoria] = useState<CategoriaReporte | ''>('');
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  async function manejarSubmit(e: FormEvent) {
    e.preventDefault();
    if (!categoria) { setError('Elige la categoría del motivo.'); return; }
    if (categoria === 'Otro' && !motivo.trim()) { setError('Describe el motivo del reporte.'); return; }
    setEnviando(true);
    setError(null);
    try {
      await reportarComentario(comentarioId, categoria, motivo.trim());
      setEnviado(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar el reporte.');
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) return <p className="comentario-meta">Reporte enviado. Un validador lo revisará.</p>;

  return (
    <form onSubmit={manejarSubmit} className="formulario" style={{ maxWidth: '420px' }}>
      <label>
        Motivo del reporte
        <select value={categoria} onChange={(e) => setCategoria(e.target.value as CategoriaReporte | '')} required>
          <option value="">Elige una categoría…</option>
          {CATEGORIAS_REPORTE.map((c) => <option key={c.valor} value={c.valor}>{c.etiqueta}</option>)}
        </select>
      </label>
      <label>
        {categoria === 'Otro' ? 'Describe el motivo' : 'Descripción (opcional)'}
        <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={1000} required={categoria === 'Otro'} placeholder="Cuéntale al equipo qué viste y por qué crees que es un problema." />
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
