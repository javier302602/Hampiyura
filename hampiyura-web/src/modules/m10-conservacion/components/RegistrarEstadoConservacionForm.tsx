import { FormEvent, useState } from 'react';
import { NIVELES_RIESGO_CONSERVACION, registrarEstadoConservacion, type NivelRiesgoConservacion, type EstadoConservacionProps } from '../api/conservacion.api';

interface Props {
  plantaId: string;
  onRegistrado: (creado: EstadoConservacionProps) => void;
  onCancelar: () => void;
}

function RegistrarEstadoConservacionForm({ plantaId, onRegistrado, onCancelar }: Props) {
  const [categoria, setCategoria] = useState('');
  const [zona, setZona] = useState('');
  const [amenazas, setAmenazas] = useState('');
  const [nivelRiesgo, setNivelRiesgo] = useState<NivelRiesgoConservacion>('NoEvaluada');
  const [disponibilidadTemporada, setDisponibilidadTemporada] = useState('');
  const [recomendacionesConservacion, setRecomendacionesConservacion] = useState('');
  const [metodosPropagacion, setMetodosPropagacion] = useState('');
  const [alternativasCultivo, setAlternativasCultivo] = useState('');
  const [fuenteOficial, setFuenteOficial] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function manejarSubmit(e: FormEvent) {
    e.preventDefault();
    // RF-267: el formulario bloquea el envío sin fuente -- no confía en que el backend la rechace.
    if (!fuenteOficial.trim()) { setError('La fuente oficial es obligatoria: no se puede registrar un estado de conservación sin ella.'); return; }
    setEnviando(true);
    setError(null);
    try {
      const creado = await registrarEstadoConservacion(plantaId, {
        categoria, zona, amenazas, nivelRiesgo, disponibilidadTemporada,
        recomendacionesConservacion, metodosPropagacion, alternativasCultivo, fuenteOficial,
      });
      onRegistrado(creado);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar el estado de conservación. Revisa los campos obligatorios.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={manejarSubmit} className="formulario">
      <label>
        Categoría (tal como la cita la fuente, ej. "Vulnerable")
        <input type="text" value={categoria} onChange={(e) => setCategoria(e.target.value)} required />
      </label>
      <label>
        Zona (descripción general — nunca coordenadas exactas)
        <textarea value={zona} onChange={(e) => setZona(e.target.value)} required />
      </label>
      <label>
        Amenazas
        <textarea value={amenazas} onChange={(e) => setAmenazas(e.target.value)} required />
      </label>
      <label>
        Nivel de riesgo
        <select value={nivelRiesgo} onChange={(e) => setNivelRiesgo(e.target.value as NivelRiesgoConservacion)}>
          {NIVELES_RIESGO_CONSERVACION.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </label>
      <label>
        Disponibilidad / temporada
        <input type="text" value={disponibilidadTemporada} onChange={(e) => setDisponibilidadTemporada(e.target.value)} required />
      </label>
      <label>
        Recomendaciones de conservación
        <textarea value={recomendacionesConservacion} onChange={(e) => setRecomendacionesConservacion(e.target.value)} required />
      </label>
      <label>
        Métodos de propagación
        <textarea value={metodosPropagacion} onChange={(e) => setMetodosPropagacion(e.target.value)} required />
      </label>
      <label>
        Alternativas de cultivo
        <textarea value={alternativasCultivo} onChange={(e) => setAlternativasCultivo(e.target.value)} required />
      </label>
      <label>
        Fuente oficial (obligatoria)
        <input type="text" value={fuenteOficial} onChange={(e) => setFuenteOficial(e.target.value)} placeholder="Ej. Libro Rojo de especies, MINAM, IUCN…" required />
      </label>

      <p className="comentario-meta">Este registro quedará "Pendiente" hasta que un especialista lo revise; no será visible en la ficha de la planta hasta entonces.</p>

      {error && <p className="error-formulario">{error}</p>}
      <div style={{ display: 'flex', gap: '.5rem' }}>
        <button type="submit" disabled={enviando || !fuenteOficial.trim()}>{enviando ? 'Enviando…' : 'Registrar estado de conservación'}</button>
        <button type="button" onClick={onCancelar}>Cancelar</button>
      </div>
    </form>
  );
}

export default RegistrarEstadoConservacionForm;
