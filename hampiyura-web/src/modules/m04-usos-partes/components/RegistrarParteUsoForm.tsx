import { FormEvent, useState } from 'react';
import { TIPOS_PARTE, TIPOS_CONOCIMIENTO, registrarParteUso, type Uso, type TipoConocimiento } from '../api/partes-uso.api';

interface Props {
  plantaId: string;
  usos: Uso[];
  onRegistrado: () => void;
}

function RegistrarParteUsoForm({ plantaId, usos, onRegistrado }: Props) {
  const [parte, setParte] = useState<(typeof TIPOS_PARTE)[number]>(TIPOS_PARTE[0]);
  const [usoId, setUsoId] = useState(usos[0]?.id ?? '');
  const [tipoConocimiento, setTipoConocimiento] = useState<TipoConocimiento>('Tradicional');
  const [fuente, setFuente] = useState('');
  const [contraindicaciones, setContraindicaciones] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const noSeraVerificado = tipoConocimiento === 'Tradicional' || tipoConocimiento === 'Pendiente';

  async function manejarSubmit(e: FormEvent) {
    e.preventDefault();
    if (!usoId) { setError('Selecciona un uso del catálogo.'); return; }
    if (!fuente.trim()) { setError('La fuente es obligatoria.'); return; }
    setEnviando(true);
    setError(null);
    try {
      await registrarParteUso({ plantaId, parte, usoId, tipoConocimiento, fuente, contraindicaciones: contraindicaciones.trim() || undefined });
      setFuente('');
      setContraindicaciones('');
      onRegistrado();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar la propuesta. Intenta nuevamente.');
    } finally {
      setEnviando(false);
    }
  }

  if (usos.length === 0) return <p>Todavía no hay usos en el catálogo para poder proponer una combinación.</p>;

  return (
    <form onSubmit={manejarSubmit} className="formulario">
      <label>
        Parte utilizada
        <select value={parte} onChange={(e) => setParte(e.target.value as typeof parte)}>
          {TIPOS_PARTE.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </label>
      <label>
        Uso / finalidad
        <select value={usoId} onChange={(e) => setUsoId(e.target.value)}>
          {usos.map((u) => <option key={u.id} value={u.id}>{u.nombre}</option>)}
        </select>
      </label>
      <label>
        Tipo de conocimiento
        <select value={tipoConocimiento} onChange={(e) => setTipoConocimiento(e.target.value as TipoConocimiento)}>
          {TIPOS_CONOCIMIENTO.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </label>

      {noSeraVerificado ? (
        <p className="advertencia-no-verificado">
          ⚠ Con "{tipoConocimiento}", esta combinación Parte+Uso <strong>nunca</strong> se mostrará como verificada científicamente — ni siquiera si un especialista la aprueba. Solo el conocimiento "Científico" ya validado puede mostrarse como verificado.
        </p>
      ) : (
        <p className="nota-cientifico">Con "Científico", esta combinación podrá mostrarse como verificada, pero solo después de que un especialista la apruebe (queda "Pendiente de validar" hasta entonces).</p>
      )}

      <label>
        Fuente citada
        <input type="text" value={fuente} onChange={(e) => setFuente(e.target.value)} placeholder="Ej. entrevista con portador de conocimiento, publicación científica…" required />
      </label>
      <label>
        Contraindicaciones (opcional — solo si la fuente las declara)
        <input type="text" value={contraindicaciones} onChange={(e) => setContraindicaciones(e.target.value)} />
      </label>

      {error && <p className="error-formulario">{error}</p>}
      <button type="submit" disabled={enviando}>{enviando ? 'Enviando…' : 'Proponer Parte+Uso'}</button>
    </form>
  );
}

export default RegistrarParteUsoForm;
