import { useEffect, useState } from 'react';
import { obtenerPlanta, type PlantaVisible } from '../api/plantas.api';
import { listarPartesUsoPorPlanta, listarUsos, type ParteUso, type Uso } from '../../m04-usos-partes/api/partes-uso.api';
import ParteUsoCard from '../../m04-usos-partes/components/ParteUsoCard';
import RegistrarParteUsoForm from '../../m04-usos-partes/components/RegistrarParteUsoForm';
import CrearPublicacionForm from '../../m06-publicaciones/components/CrearPublicacionForm';
import AlertaConservacion from '../../m10-conservacion/components/AlertaConservacion';
import ConservacionSection from '../../m10-conservacion/components/ConservacionSection';
import FichasCultivoSection from '../../m03-cultivo/components/FichasCultivoSection';
import RequireRole from '../../../shared/auth/RequireRole';
import { obtenerImagenPlanta } from '../components/imagen-planta';

interface Props {
  plantaId: string;
  onVolver: () => void;
}

function PlantaDetailPage({ plantaId, onVolver }: Props) {
  const [planta, setPlanta] = useState<PlantaVisible | null>(null);
  const [partesUso, setPartesUso] = useState<ParteUso[]>([]);
  const [usos, setUsos] = useState<Uso[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarFormularioPublicacion, setMostrarFormularioPublicacion] = useState(false);
  const [publicacionCreada, setPublicacionCreada] = useState(false);

  function cargarPartesUso() {
    listarPartesUsoPorPlanta(plantaId).then(setPartesUso).catch(() => setError('No se pudieron cargar los usos de esta planta.'));
  }

  useEffect(() => {
    setCargando(true);
    setError(null);
    Promise.all([obtenerPlanta(plantaId), listarPartesUsoPorPlanta(plantaId), listarUsos()])
      .then(([p, pu, u]) => { setPlanta(p); setPartesUso(pu); setUsos(u); })
      .catch(() => setError('No se pudo cargar la ficha de la planta.'))
      .finally(() => setCargando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plantaId]);

  function nombreDeUso(usoId: string): string { return usos.find((u) => u.id === usoId)?.nombre ?? usoId; }

  if (cargando) return <p>Cargando ficha de la planta…</p>;
  if (error) return <p>{error}</p>;
  if (!planta) return <p>No se encontró la planta.</p>;

  return (
    <section>
      <button onClick={onVolver}>← Volver al catálogo</button>
      <h2>{planta.nombreComun}</h2>
      <p><em>{planta.nombreCientifico}</em> — familia {planta.familia}</p>
      <p>Región: {planta.region} · Hábitat: {planta.habitat}</p>
      {obtenerImagenPlanta(planta) && <img className="imagen-ficha-planta" src={obtenerImagenPlanta(planta)} alt={planta.nombreComun} />}
      <AlertaConservacion conservacion={planta.conservacion} />

      <h3>Partes utilizadas y usos</h3>
      {partesUso.length === 0 ? (
        <p>Esta planta todavía no tiene usos registrados.</p>
      ) : (
        <div className="cards">
          {partesUso.map((pu) => <ParteUsoCard key={pu.id} parteUso={pu} nombreUso={nombreDeUso(pu.usoId)} />)}
        </div>
      )}

      <RequireRole permitido={() => true}>
        <div style={{ marginTop: '1.5rem' }}>
          {mostrarFormulario ? (
            <RegistrarParteUsoForm
              plantaId={plantaId}
              usos={usos}
              onRegistrado={() => { setMostrarFormulario(false); cargarPartesUso(); }}
            />
          ) : (
            <button onClick={() => setMostrarFormulario(true)}>Proponer un nuevo uso para esta planta</button>
          )}
        </div>
      </RequireRole>

      <h3>Publicaciones sobre esta planta (M-06)</h3>
      <RequireRole permitido={() => true}>
        <div style={{ marginTop: '1rem' }}>
          {publicacionCreada && <p className="comentario-meta">Publicación enviada como "Pendiente". Aparecerá en el feed público solo tras ser validada por un especialista.</p>}
          {mostrarFormularioPublicacion ? (
            <CrearPublicacionForm
              plantaId={plantaId}
              onCreada={() => { setMostrarFormularioPublicacion(false); setPublicacionCreada(true); }}
            />
          ) : (
            <button onClick={() => { setMostrarFormularioPublicacion(true); setPublicacionCreada(false); }}>Nueva publicación sobre esta planta</button>
          )}
        </div>
      </RequireRole>

      <ConservacionSection plantaId={plantaId} conservacion={planta.conservacion} />
      <FichasCultivoSection plantaId={plantaId} />
    </section>
  );
}

export default PlantaDetailPage;
