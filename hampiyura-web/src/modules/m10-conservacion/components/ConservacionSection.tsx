import { useEffect, useState } from 'react';
import { listarAccionesConservacion, type EstadoConservacionVisible, type AccionConservacion, type EstadoConservacionProps } from '../api/conservacion.api';
import DetalleConservacion from './DetalleConservacion';
import RegistrarEstadoConservacionForm from './RegistrarEstadoConservacionForm';
import RegistrarAccionConservacionForm from './RegistrarAccionConservacionForm';
import RequireRole from '../../../shared/auth/RequireRole';
import { esValidador } from '../../../shared/auth/session';

function ConservacionSection({ plantaId, conservacion }: { plantaId: string; conservacion: EstadoConservacionVisible }) {
  const [mostrarDetalle, setMostrarDetalle] = useState(false);
  const [mostrarFormularioEstado, setMostrarFormularioEstado] = useState(false);
  const [estadoRegistrado, setEstadoRegistrado] = useState<EstadoConservacionProps | null>(null);
  const [acciones, setAcciones] = useState<AccionConservacion[]>([]);

  function cargarAcciones() {
    listarAccionesConservacion(plantaId).then(setAcciones).catch(() => {});
  }
  useEffect(cargarAcciones, [plantaId]);

  return (
    <section style={{ marginTop: '1.5rem' }}>
      <h3>Conservación</h3>

      {conservacion.disponible && (
        <>
          <button onClick={() => setMostrarDetalle((v) => !v)}>{mostrarDetalle ? 'Ocultar detalle de conservación' : 'Ver detalle de conservación'}</button>
          {mostrarDetalle && <DetalleConservacion conservacion={conservacion} />}
        </>
      )}

      <RequireRole permitido={esValidador}>
        <div style={{ marginTop: '1rem' }}>
          {estadoRegistrado && (
            <p className="comentario-meta">Estado de conservación registrado como "Pendiente" (nivel {estadoRegistrado.nivelRiesgo}). No será visible en la ficha hasta que otro especialista/administrador lo apruebe en la bandeja de validación.</p>
          )}
          {mostrarFormularioEstado ? (
            <RegistrarEstadoConservacionForm
              plantaId={plantaId}
              onRegistrado={(creado) => { setMostrarFormularioEstado(false); setEstadoRegistrado(creado); }}
              onCancelar={() => setMostrarFormularioEstado(false)}
            />
          ) : (
            <button onClick={() => { setMostrarFormularioEstado(true); setEstadoRegistrado(null); }}>Registrar estado de conservación</button>
          )}
        </div>
      </RequireRole>

      <h4 style={{ marginTop: '1.5rem' }}>Acciones de conservación registradas</h4>
      {acciones.length === 0 ? (
        <p>Todavía no hay acciones de conservación registradas para esta planta.</p>
      ) : (
        <div className="cards">
          {acciones.map((a) => (
            <article key={a.id}>
              <strong>{a.descripcion}</strong>
              <span className="badge badge-estado">{a.estadoSeguimiento}</span>
              <span>Responsable: {a.responsable}</span>
              <span>Evidencias: {a.evidencias}</span>
              <span className="comentario-meta">{new Date(a.fecha).toLocaleDateString()}</span>
            </article>
          ))}
        </div>
      )}
      <RequireRole permitido={() => true}>
        <RegistrarAccionConservacionForm plantaId={plantaId} onRegistrada={cargarAcciones} />
      </RequireRole>
    </section>
  );
}

export default ConservacionSection;
