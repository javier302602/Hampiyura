import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listarFichasPorPlanta, type FichaCultivoVisible } from '../api/fichas-cultivo.api';
import RegistrarUbicacionCultivoForm from './RegistrarUbicacionCultivoForm';
import GuiaCultivo from './GuiaCultivo';
import AvisoMarcoLegal from './AvisoMarcoLegal';
import ProponerContratoCultivoForm from '../../m17-compra-cultivo/components/ProponerContratoCultivoForm';
import { RUTAS_CONTRATOS_CULTIVO } from '../../m17-compra-cultivo/api/contratos-cultivo.api';
import { getSession } from '../../../shared/auth/session';
import RequireRole from '../../../shared/auth/RequireRole';

// M-03: no existía ninguna pantalla que listara las fichas de cultivo de una planta ni que
// permitiera registrarles una ubicación -- el backend (GET /plantas/:plantaId/cultivos,
// POST /cultivos/:cultivoId/ubicacion) ya existía, pero nada del frontend lo llamaba. Esta sección
// es mínima a propósito: solo lista fichas ya existentes y permite ubicarlas. Crear una ficha de
// cultivo nueva es un formulario aparte, fuera de este alcance.
function FichasCultivoSection({ plantaId }: { plantaId: string }) {
  const navigate = useNavigate();
  const usuarioId = getSession()?.userId;
  const [fichas, setFichas] = useState<FichaCultivoVisible[]>([]);
  const [cargando, setCargando] = useState(true);
  const [fichaConFormularioAbierto, setFichaConFormularioAbierto] = useState<string | null>(null);
  const [ubicacionRegistrada, setUbicacionRegistrada] = useState<string | null>(null);
  const [fichaConPropuestaAbierta, setFichaConPropuestaAbierta] = useState<string | null>(null);

  function guardarGuia(id: string, guia: FichaCultivoVisible['guia']) { setFichas((prev) => prev.map((f) => (f.id === id ? { ...f, guia } : f))); }

  function cargar() {
    setCargando(true);
    listarFichasPorPlanta(plantaId).then(setFichas).catch(() => {}).finally(() => setCargando(false));
  }
  useEffect(cargar, [plantaId]);

  if (cargando) return null;
  if (fichas.length === 0) return null;

  return (
    <section style={{ marginTop: '1.5rem' }}>
      <h3>Fichas de cultivo</h3>
      <AvisoMarcoLegal />
      {ubicacionRegistrada && <p className="sello-verificado">✔ Ubicación registrada correctamente.</p>}
      <div className="cards">
        {fichas.map((f) => (
          <article key={f.id}>
            {f.disponible ? (
              <>
                <strong>{f.zonaCultivo}</strong>
                <span>{f.metodoPropagacion}</span>
              </>
            ) : (
              <span className="comentario-meta">{f.mensaje}</span>
            )}
            <span className="badge badge-estado">{f.estadoValidacion}</span>
            <GuiaCultivo cultivoId={f.id} guia={f.guia} onGuardada={(g) => guardarGuia(f.id, g)} />
            <RequireRole permitido={() => true}>
              {fichaConFormularioAbierto === f.id ? (
                <button type="button" onClick={() => setFichaConFormularioAbierto(null)}>Cancelar</button>
              ) : (
                <button type="button" onClick={() => { setFichaConFormularioAbierto(f.id); setUbicacionRegistrada(null); }}>
                  Registrar ubicación
                </button>
              )}
            </RequireRole>
            {f.disponible && f.autorId !== usuarioId && (
              <RequireRole permitido={() => true}>
                {fichaConPropuestaAbierta === f.id ? (
                  <ProponerContratoCultivoForm
                    cultivoId={f.id}
                    onPropuesta={(id) => navigate(RUTAS_CONTRATOS_CULTIVO.detalle(id))}
                    onCancelar={() => setFichaConPropuestaAbierta(null)}
                  />
                ) : (
                  <button type="button" onClick={() => setFichaConPropuestaAbierta(f.id)}>Pedir esta cosecha</button>
                )}
              </RequireRole>
            )}
          </article>
        ))}
      </div>

      {fichaConFormularioAbierto && (
        <div style={{ marginTop: '1rem' }}>
          <RegistrarUbicacionCultivoForm
            cultivoId={fichaConFormularioAbierto}
            plantaId={plantaId}
            onRegistrada={() => { setFichaConFormularioAbierto(null); setUbicacionRegistrada(fichaConFormularioAbierto); }}
          />
        </div>
      )}
    </section>
  );
}

export default FichasCultivoSection;
