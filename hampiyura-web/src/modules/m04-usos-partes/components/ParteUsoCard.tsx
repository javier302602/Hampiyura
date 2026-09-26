import { useEffect, useState } from 'react';
import TipoConocimientoBadge from './TipoConocimientoBadge';
import type { ParteUso } from '../api/partes-uso.api';
import { listarPreparacionesPorParteUso, AVISO_CULTURAL_TRADICIONAL, type Preparacion, type PreparacionVisible } from '../../m05-preparaciones/api/preparaciones.api';
import PreparacionCard from '../../m05-preparaciones/components/PreparacionCard';
import DocumentarPreparacionForm from '../../m05-preparaciones/components/DocumentarPreparacionForm';
import RequireRole from '../../../shared/auth/RequireRole';

function ParteUsoCard({ parteUso, nombreUso }: { parteUso: ParteUso; nombreUso: string }) {
  const [preparaciones, setPreparaciones] = useState<PreparacionVisible[]>([]);
  const [pendienteRecienCreada, setPendienteRecienCreada] = useState<Preparacion | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  function cargarPreparaciones() {
    listarPreparacionesPorParteUso(parteUso.id).then(setPreparaciones).catch(() => {});
  }

  useEffect(cargarPreparaciones, [parteUso.id]);

  return (
    <article>
      <strong>{parteUso.parte}</strong>
      <span>Uso: {nombreUso}</span>
      <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
        <TipoConocimientoBadge tipo={parteUso.tipoConocimiento} />
        <span className="badge badge-estado">{parteUso.estadoValidacion}</span>
      </div>
      {parteUso.verificado ? (
        <p className="sello-verificado">✔ Contenido verificado científicamente</p>
      ) : (
        <p className="advertencia-no-verificado">⚠ {parteUso.advertencia}</p>
      )}
      {parteUso.contraindicaciones && <span>Contraindicaciones: {parteUso.contraindicaciones}</span>}
      <span className="fuente-cita">Fuente: {parteUso.fuente.valor}</span>

      <h4>Preparaciones</h4>
      {preparaciones.length === 0 && !pendienteRecienCreada && <p>Todavía no hay preparaciones documentadas y validadas para esta combinación.</p>}
      {preparaciones.map((p) => <PreparacionCard key={p.id} preparacion={p} avisoLegal={p.avisoLegal} />)}
      {pendienteRecienCreada && (
        <>
          <p className="comentario-meta">Tu preparación fue enviada — visible aquí solo para ti mientras está pendiente de revisión:</p>
          <PreparacionCard preparacion={pendienteRecienCreada} avisoLegal={AVISO_CULTURAL_TRADICIONAL} />
        </>
      )}

      <RequireRole permitido={() => true}>
        {mostrarFormulario ? (
          <DocumentarPreparacionForm
            parteUsoId={parteUso.id}
            onDocumentada={(creada) => { setMostrarFormulario(false); setPendienteRecienCreada(creada); cargarPreparaciones(); }}
            onCancelar={() => setMostrarFormulario(false)}
          />
        ) : (
          <button onClick={() => setMostrarFormulario(true)}>Documentar preparación</button>
        )}
      </RequireRole>
    </article>
  );
}

export default ParteUsoCard;
