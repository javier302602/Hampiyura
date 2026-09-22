import { FormEvent, useState } from 'react';
import { documentarPreparacion, type Preparacion } from '../api/preparaciones.api';

interface Props {
  parteUsoId: string;
  onDocumentada: (creada: Preparacion) => void;
  onCancelar: () => void;
}

function DocumentarPreparacionForm({ parteUsoId, onDocumentada, onCancelar }: Props) {
  const [ingredientes, setIngredientes] = useState('');
  const [pasos, setPasos] = useState('');
  const [herramientas, setHerramientas] = useState('');
  const [tiempoPreparacion, setTiempoPreparacion] = useState('');
  const [formaTradicionalElaboracion, setFormaTradicionalElaboracion] = useState('');
  const [formaConservacion, setFormaConservacion] = useState('');
  const [advertencias, setAdvertencias] = useState('');
  const [contraindicaciones, setContraindicaciones] = useState('');
  const [fuente, setFuente] = useState('');
  const [localidad, setLocalidad] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function manejarSubmit(e: FormEvent) {
    e.preventDefault();
    if (!fuente.trim()) { setError('La fuente es obligatoria.'); return; }
    setEnviando(true);
    setError(null);
    try {
      const creada = await documentarPreparacion({
        parteUsoId, ingredientes, pasos, herramientas, tiempoPreparacion, formaTradicionalElaboracion,
        formaConservacion, advertencias, contraindicaciones: contraindicaciones.trim() || undefined, fuente, localidad,
      });
      onDocumentada(creada);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo documentar la preparación. Revisa los campos obligatorios.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={manejarSubmit} className="formulario">
      <label>
        Ingredientes
        <textarea value={ingredientes} onChange={(e) => setIngredientes(e.target.value)} required />
      </label>
      <label>
        Proceso paso a paso
        <textarea value={pasos} onChange={(e) => setPasos(e.target.value)} required />
      </label>
      <label>
        Herramientas / materiales
        <textarea value={herramientas} onChange={(e) => setHerramientas(e.target.value)} required />
      </label>
      <label>
        Tiempo de preparación
        <input type="text" value={tiempoPreparacion} onChange={(e) => setTiempoPreparacion(e.target.value)} placeholder="Ej. 20 minutos de cocción + 1 noche de reposo" required />
      </label>
      <label>
        Forma tradicional de elaboración
        <textarea value={formaTradicionalElaboracion} onChange={(e) => setFormaTradicionalElaboracion(e.target.value)} required />
      </label>
      <label>
        Forma de conservación
        <input type="text" value={formaConservacion} onChange={(e) => setFormaConservacion(e.target.value)} required />
      </label>
      <label>
        Advertencias
        <textarea value={advertencias} onChange={(e) => setAdvertencias(e.target.value)} required />
      </label>
      <label>
        Contraindicaciones (opcional — solo si la fuente las declara)
        <input type="text" value={contraindicaciones} onChange={(e) => setContraindicaciones(e.target.value)} />
      </label>
      <label>
        Fuente citada
        <input type="text" value={fuente} onChange={(e) => setFuente(e.target.value)} placeholder="Ej. entrevista con portador de conocimiento, publicación científica…" required />
      </label>
      <label>
        Localidad
        <input type="text" value={localidad} onChange={(e) => setLocalidad(e.target.value)} required />
      </label>

      <p className="comentario-meta">Tu documentación quedará "Pendiente" hasta que un especialista la revise; no será visible junto al Parte+Uso hasta entonces.</p>

      {error && <p className="error-formulario">{error}</p>}
      <div style={{ display: 'flex', gap: '.5rem' }}>
        <button type="submit" disabled={enviando}>{enviando ? 'Enviando…' : 'Documentar preparación'}</button>
        <button type="button" onClick={onCancelar}>Cancelar</button>
      </div>
    </form>
  );
}

export default DocumentarPreparacionForm;
