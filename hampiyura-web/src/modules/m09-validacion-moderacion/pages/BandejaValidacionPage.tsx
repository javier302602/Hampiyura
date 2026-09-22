import { useEffect, useState } from 'react';
import { listarPendientes, aprobar, observar, rechazar, type ValidacionPendiente } from '../api/validaciones.api';

function BandejaValidacionPage() {
  const [pendientes, setPendientes] = useState<ValidacionPendiente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accionError, setAccionError] = useState<string | null>(null);

  function cargar() {
    setCargando(true);
    listarPendientes()
      .then(setPendientes)
      .catch(() => setError('No se pudo cargar la bandeja de pendientes.'))
      .finally(() => setCargando(false));
  }

  useEffect(cargar, []);

  // Antes estas acciones no tenían try/catch: si el backend rechazaba (ej. "la validación ya fue
  // resuelta"), el error quedaba como una promesa rechazada sin manejar, invisible para quien
  // usa la bandeja -- peor que un mensaje genérico. Ahora se muestra el mensaje real del backend.
  async function manejarAprobar(id: string) {
    setAccionError(null);
    try { await aprobar(id); cargar(); }
    catch (err) { setAccionError(err instanceof Error ? err.message : 'No se pudo aprobar.'); }
  }
  async function manejarObservar(id: string) {
    const comentario = window.prompt('Motivo de la observación:');
    if (!comentario) return;
    setAccionError(null);
    try { await observar(id, comentario); cargar(); }
    catch (err) { setAccionError(err instanceof Error ? err.message : 'No se pudo observar.'); }
  }
  async function manejarRechazar(id: string) {
    const comentario = window.prompt('Motivo del rechazo:');
    if (!comentario) return;
    setAccionError(null);
    try { await rechazar(id, comentario); cargar(); }
    catch (err) { setAccionError(err instanceof Error ? err.message : 'No se pudo rechazar.'); }
  }

  if (cargando) return <p>Cargando bandeja de validación…</p>;
  if (error) return <p>{error}</p>;

  return (
    <section className="gestion-panel">
      <h2>Bandeja de validación (M-09)</h2>
      {accionError && <p className="error-formulario">{accionError}</p>}
      {pendientes.length === 0 ? (
        <p>No hay contenido pendiente de revisión.</p>
      ) : (
        <div className="cards">
          {pendientes.map((v) => (
            <article key={v.id}>
              <span className="badge badge-estado">{v.tipoEntidad}</span>
              <strong>{v.etiqueta}</strong>
              <span>{new Date(v.fecha).toLocaleString()}</span>
              <div style={{ display: 'flex', gap: '.5rem', marginTop: '.5rem' }}>
                <button onClick={() => manejarAprobar(v.id)}>Aprobar</button>
                <button onClick={() => manejarObservar(v.id)}>Observar</button>
                <button onClick={() => manejarRechazar(v.id)}>Rechazar</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default BandejaValidacionPage;
