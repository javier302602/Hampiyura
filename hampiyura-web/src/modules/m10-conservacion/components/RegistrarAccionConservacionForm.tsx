import { FormEvent, useState } from 'react';
import { ESTADOS_SEGUIMIENTO_ACCION, registrarAccionConservacion, type EstadoSeguimientoAccion, type AccionConservacion } from '../api/conservacion.api';

interface Props {
  plantaId: string;
  onRegistrada: (creada: AccionConservacion) => void;
}

// RF-268: a diferencia del estado de conservación, esto NO exige fuente y se publica de inmediato
// (no pasa por M-09) -- es un registro de actividad, no una afirmación científica.
function RegistrarAccionConservacionForm({ plantaId, onRegistrada }: Props) {
  const [descripcion, setDescripcion] = useState('');
  const [responsable, setResponsable] = useState('');
  const [evidencias, setEvidencias] = useState('');
  const [estadoSeguimiento, setEstadoSeguimiento] = useState<EstadoSeguimientoAccion>('Planificada');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function manejarSubmit(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const creada = await registrarAccionConservacion(plantaId, { descripcion, responsable, evidencias, estadoSeguimiento });
      setDescripcion(''); setResponsable(''); setEvidencias(''); setEstadoSeguimiento('Planificada');
      onRegistrada(creada);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar la acción de conservación.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={manejarSubmit} className="formulario">
      <label>
        Descripción de la acción
        <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Ej. Campaña de reforestación comunitaria" required />
      </label>
      <label>
        Responsable
        <input type="text" value={responsable} onChange={(e) => setResponsable(e.target.value)} required />
      </label>
      <label>
        Evidencias
        <textarea value={evidencias} onChange={(e) => setEvidencias(e.target.value)} required />
      </label>
      <label>
        Estado de seguimiento
        <select value={estadoSeguimiento} onChange={(e) => setEstadoSeguimiento(e.target.value as EstadoSeguimientoAccion)}>
          {ESTADOS_SEGUIMIENTO_ACCION.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
      </label>

      <p className="comentario-meta">Esto no requiere fuente ni revisión: se publica de inmediato (no es una afirmación científica, es un registro de actividad).</p>

      {error && <p className="error-formulario">{error}</p>}
      <button type="submit" disabled={enviando}>{enviando ? 'Enviando…' : 'Registrar acción de conservación'}</button>
    </form>
  );
}

export default RegistrarAccionConservacionForm;
