import { useEffect, useState } from 'react';
import { ArrowRight, FlaskConical, MapPin, MessageSquare, Sprout } from 'lucide-react';
import { listarPlantas, type Planta } from '../modules/m02-catalogo-plantas/api/plantas.api';
import { obtenerImagenPlanta } from '../modules/m02-catalogo-plantas/components/imagen-planta';
import { listarPublicaciones, type Publicacion } from '../modules/m06-publicaciones/api/publicaciones.api';
import PublicacionCard from '../modules/m06-publicaciones/components/PublicacionCard';
import Button from '../shared/ui/Button';
import PlantCard from '../shared/ui/PlantCard';
import { etiquetaDeRiesgo, plantasEnRiesgo } from '../modules/m10-conservacion/evaluacion-conservacion';
import SectionHeader from '../shared/ui/SectionHeader';
import LoadingState from '../shared/ui/LoadingState';
import ErrorState from '../shared/ui/ErrorState';
import EmptyState from '../shared/ui/EmptyState';

interface Props {
  onIrACatalogo: () => void;
  onIrAPublicaciones: () => void;
  onSeleccionarPlanta: (id: string) => void;
  onSeleccionarPublicacion: (id: string) => void;
  onIrAMapaCultivo: () => void;
  onIrAEnviarConsulta: () => void;
}

const FEATURES = [
  { icon: Sprout, titulo: 'Plantas', desc: 'Catálogo de especies amazónicas con usos, propiedades y estado de validación.', key: 'plantas' as const },
  { icon: MapPin, titulo: 'Cultivo', desc: 'Mapa de ubicaciones de cultivo registradas por la comunidad, con relieve real.', key: 'cultivo' as const },
  { icon: MessageSquare, titulo: 'Consultas', desc: 'Pregunta a especialistas o reporta hallazgos, con o sin cuenta.', key: 'consultas' as const },
  { icon: FlaskConical, titulo: 'Publicaciones', desc: 'Saberes documentados por la comunidad, validados antes de publicarse.', key: 'publicaciones' as const },
];

// Página de inicio nueva y separada del catálogo (antes "/" redirigía directo a
// /m02-catalogo-plantas -- ver plan de rediseño). No inventa datos: reusa listarPlantas() (M-02) y
// listarPublicaciones() (M-06), ya existentes, solo muestra un adelanto de cada una.
function HomePage({ onIrACatalogo, onIrAPublicaciones, onSeleccionarPlanta, onSeleccionarPublicacion, onIrAMapaCultivo, onIrAEnviarConsulta }: Props) {
  const [plantas, setPlantas] = useState<Planta[] | null>(null);
  const [errorPlantas, setErrorPlantas] = useState<string | null>(null);
  const [publicaciones, setPublicaciones] = useState<Publicacion[] | null>(null);
  const [errorPublicaciones, setErrorPublicaciones] = useState<string | null>(null);

  useEffect(() => {
    // Prioriza especies con fotografía curada -- listarPlantas() no garantiza ningún orden, y
    // mostrar primero las que solo tienen datos de prueba (sin imagen) le resta a la sección
    // "destacadas" justo lo que debía protagonizar (foto real, ver identidad visual).
    listarPlantas()
      .then((todas) => [...todas].sort((a, b) => Number(!!obtenerImagenPlanta(b)) - Number(!!obtenerImagenPlanta(a))))
      .then(setPlantas)
      .catch(() => setErrorPlantas('No se pudo cargar el catálogo de plantas.'));
    listarPublicaciones().then(setPublicaciones).catch(() => setErrorPublicaciones('No se pudieron cargar las publicaciones.'));
  }, []);

  function irAFeature(key: typeof FEATURES[number]['key']) {
    if (key === 'plantas') onIrACatalogo();
    else if (key === 'cultivo') onIrAMapaCultivo();
    else if (key === 'consultas') onIrAEnviarConsulta();
    else onIrAPublicaciones();
  }

  return (
    <>
      <div className="hero">
        <div className="hero-contenido">
          <p className="eyebrow">HAMPIYURA · SABERES VIVOS</p>
          <h1>Saberes que echan raíces.</h1>
          <p>Explora plantas amazónicas, conecta conocimiento comunitario y ayuda a cuidar el territorio.</p>
          <div className="hero-cta-row">
            <Button variant="primary" size="lg" iconRight={<ArrowRight size={18} aria-hidden="true" />} onClick={onIrACatalogo}>
              Explorar plantas
            </Button>
            <Button variant="onBrand" size="lg" onClick={() => document.getElementById('conocer-hampiyura')?.scrollIntoView({ behavior: 'smooth' })}>
              Conocer HampiYura
            </Button>
          </div>
        </div>
        <p className="hero-credit">Fotografía: Ivan Mlinaric, dosel amazónico cerca de Puerto Maldonado · CC BY 2.0 · Wikimedia Commons</p>
      </div>

      <section className="home-section" id="conocer-hampiyura">
        <SectionHeader
          eyebrow="Conocimiento vivo"
          title="Explora el conocimiento vivo"
          description="HampiYura conecta el saber tradicional, la ciencia y el territorio en un mismo lugar."
        />
        <div className="feature-grid">
          {FEATURES.map((f) => (
            <button key={f.key} className="card-ui feature-card" onClick={() => irAFeature(f.key)}>
              <span className="feature-card-icon"><f.icon size={22} aria-hidden="true" /></span>
              <span className="feature-card-title">{f.titulo}</span>
              <span className="feature-card-desc">{f.desc}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="home-section">
        <SectionHeader
          eyebrow="Catálogo"
          title="Plantas destacadas"
          description="Especies amazónicas documentadas por la comunidad."
          action={<Button variant="secondary" iconRight={<ArrowRight size={16} aria-hidden="true" />} onClick={onIrACatalogo}>Ver todo el catálogo</Button>}
        />
        {plantas === null && !errorPlantas && <LoadingState cards={4} label="Cargando plantas destacadas" />}
        {errorPlantas && <ErrorState description={errorPlantas} />}
        {plantas && plantas.length === 0 && (
          <EmptyState title="Todavía no hay plantas registradas" description="El catálogo se está construyendo con la comunidad -- vuelve pronto." />
        )}
        {plantas && plantas.length > 0 && (
          <div className="card-grid">
            {plantas.slice(0, 4).map((p) => (
              <PlantCard
                key={p.id}
                nombreComun={p.nombreComun}
                nombreCientifico={p.nombreCientifico}
                familia={p.familia}
                imagenUrl={obtenerImagenPlanta(p)}
                etiquetaRiesgo={etiquetaDeRiesgo(p)}
                onAbrir={() => onSeleccionarPlanta(p.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Se arma SOLA con los datos (cualquier planta con VU/EN/CR confirmado); si no califica ninguna, no se muestra ni vacío. */}
      {plantas && plantasEnRiesgo(plantas).length > 0 && (
        <section className="home-section" aria-label="Plantas en riesgo">
          <SectionHeader
            eyebrow="Conservación"
            title="Plantas en riesgo"
            description="Especies con una categoría de riesgo confirmada (Vulnerable, En Peligro o Peligro Crítico) en la IUCN o en la lista oficial peruana. Cuidarlas también es cuidar el saber que las rodea."
          />
          <div className="card-grid">
            {plantasEnRiesgo(plantas).map((p) => (
              <PlantCard
                key={p.id}
                nombreComun={p.nombreComun}
                nombreCientifico={p.nombreCientifico}
                familia={p.familia}
                imagenUrl={obtenerImagenPlanta(p)}
                etiquetaRiesgo={etiquetaDeRiesgo(p)}
                nota={p.evaluacionConservacion?.aclaracionInicio}
                onAbrir={() => onSeleccionarPlanta(p.id)}
              />
            ))}
          </div>
        </section>
      )}

      <section className="home-section">
        <SectionHeader
          eyebrow="Comunidad"
          title="Conocimiento de la comunidad"
          description="Publicaciones validadas por especialistas sobre usos y preparaciones."
          action={<Button variant="secondary" iconRight={<ArrowRight size={16} aria-hidden="true" />} onClick={onIrAPublicaciones}>Ver publicaciones</Button>}
        />
        {publicaciones === null && !errorPublicaciones && <LoadingState cards={3} label="Cargando publicaciones" />}
        {errorPublicaciones && <ErrorState description={errorPublicaciones} />}
        {publicaciones && publicaciones.length === 0 && (
          <EmptyState title="Todavía no hay publicaciones validadas" description="Cuando la comunidad publique y un especialista valide contenido, aparecerá aquí." />
        )}
        {publicaciones && publicaciones.length > 0 && (
          <div className="cards">
            {publicaciones.slice(0, 3).map((p) => (
              <PublicacionCard key={p.id} publicacion={p} onAbrir={() => onSeleccionarPublicacion(p.id)} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

export default HomePage;
