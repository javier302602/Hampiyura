import { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import { listarPendientes, aprobar, observar, rechazar, type ValidacionPendiente } from '../api/validaciones.api';
import DetalleValidacionModal from '../components/DetalleValidacionModal';
import Button from '../../../shared/ui/Button';

// Cada tarjeta abre una vista de detalle con TODO lo que envió quien propuso el contenido; las tres
// decisiones (aprobar / observar / rechazar) viven ahí, para decidir habiendo visto el contenido completo
// (antes las tarjetas solo mostraban nombre y fecha con los botones directos).
function BandejaValidacionPage() {
  const [pendientes, setPendientes] = useState<ValidacionPendiente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [abierta, setAbierta] = useState<string | null>(null);

  function cargar() {
    setCargando(true);
    listarPendientes()
      .then(setPendientes)
      .catch(() => setError('No se pudo cargar la bandeja de pendientes.'))
      .finally(() => setCargando(false));
  }

  useEffect(cargar, []);

  // Las acciones lanzan el error real del backend (p. ej. "no puedes aprobar una ficha que tú mismo registraste");
  // el modal lo muestra y sigue abierto para que la persona pueda corregir o elegir otra decisión.
  async function manejarAprobar(id: string) { await aprobar(id); cargar(); }
  async function manejarObservar(id: string, comentario: string) { await observar(id, comentario); cargar(); }
  async function manejarRechazar(id: string, comentario: string) { await rechazar(id, comentario); cargar(); }

  if (cargando) return <p>Cargando bandeja de validación…</p>;
  if (error) return <p>{error}</p>;

  return (
    <section className="gestion-panel">
      <h2>Bandeja de validación (M-09)</h2>
      {pendientes.length === 0 ? (
        <p>No hay contenido pendiente de revisión.</p>
      ) : (
        <div className="cards">
          {pendientes.map((v) => (
            <article key={v.id} className="tarjeta-clicable" style={{ flex: '1 1 300px' }} tabIndex={0} role="button" aria-label={`Ver detalle: ${v.etiqueta}`}
              onClick={() => setAbierta(v.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setAbierta(v.id); } }}>
              <span className="badge badge-estado">{v.tipoEntidad}</span>
              <strong>{v.etiqueta}</strong>
              <span>{new Date(v.fecha).toLocaleString()}</span>
              <div style={{ marginTop: '.5rem' }}>
                <Button size="sm" variant="secondary" iconLeft={<Eye size={15} aria-hidden="true" />} tabIndex={-1} onClick={(e) => { e.stopPropagation(); setAbierta(v.id); }}>Ver detalle y decidir</Button>
              </div>
            </article>
          ))}
        </div>
      )}
      {abierta && (
        <DetalleValidacionModal
          validacionId={abierta}
          onCerrar={() => setAbierta(null)}
          onAprobar={manejarAprobar}
          onObservar={manejarObservar}
          onRechazar={manejarRechazar}
        />
      )}
    </section>
  );
}

export default BandejaValidacionPage;
