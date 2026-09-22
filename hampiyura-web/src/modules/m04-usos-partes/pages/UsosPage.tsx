import { FormEvent, useEffect, useState } from 'react';
import { listarUsos, registrarUso, type Uso } from '../api/partes-uso.api';
import RequireRole from '../../../shared/auth/RequireRole';
import { esValidador } from '../../../shared/auth/session';

function FormularioNuevoUso({ onRegistrado }: { onRegistrado: () => void }) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function manejarSubmit(e: FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) { setError('El nombre del uso es obligatorio.'); return; }
    setEnviando(true);
    setError(null);
    try {
      await registrarUso({ nombre: nombre.trim(), descripcion: descripcion.trim() || undefined });
      setNombre('');
      setDescripcion('');
      onRegistrado();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar el uso (¿ya existe ese nombre en el catálogo?).');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={manejarSubmit} className="formulario">
      <label>
        Nombre del uso/finalidad
        <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Digestivo" required />
      </label>
      <label>
        Descripción (opcional)
        <input type="text" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
      </label>
      {error && <p className="error-formulario">{error}</p>}
      <button type="submit" disabled={enviando}>{enviando ? 'Guardando…' : 'Ampliar catálogo'}</button>
    </form>
  );
}

function UsosPage() {
  const [usos, setUsos] = useState<Uso[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function cargar() {
    setCargando(true);
    listarUsos().then(setUsos).catch(() => setError('No se pudo cargar el catálogo de usos.')).finally(() => setCargando(false));
  }

  useEffect(cargar, []);

  return (
    <section>
      <h2>Catálogo de usos/finalidades (M-04)</h2>
      {cargando && <p>Cargando catálogo…</p>}
      {error && <p>{error}</p>}
      {!cargando && !error && usos.length === 0 && <p>Todavía no hay usos registrados en el catálogo.</p>}
      {!cargando && !error && usos.length > 0 && (
        <div className="cards">
          {usos.map((u) => (
            <article key={u.id}>
              <strong>{u.nombre}</strong>
              {u.descripcion && <span>{u.descripcion}</span>}
            </article>
          ))}
        </div>
      )}
      <h3>Ampliar el catálogo</h3>
      <RequireRole permitido={esValidador}>
        <FormularioNuevoUso onRegistrado={cargar} />
      </RequireRole>
    </section>
  );
}

export default UsosPage;
