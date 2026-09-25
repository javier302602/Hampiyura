import { FormEvent, useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { listarPlantas, type Planta } from '../../m02-catalogo-plantas/api/plantas.api';
import { registrarFichaCultivo, type FichaCultivoCreada } from '../api/fichas-cultivo.api';
import { registrarUbicacionCultivo } from '../api/mapa-cultivo.api';
import { direccionInversa } from '../api/geocoding.api';
import SelectorUbicacionMapa from './SelectorUbicacionMapa';
import Button from '../../../shared/ui/Button';

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const METODOS_PROPAGACION = ['Semilla', 'Esqueje', 'Estaca', 'División de mata', 'Otro'];

function SelectorMeses({ etiqueta, valor, onCambiar }: { etiqueta: string; valor: number[]; onCambiar: (meses: number[]) => void }) {
  function alternar(mes: number) {
    onCambiar(valor.includes(mes) ? valor.filter((m) => m !== mes) : [...valor, mes].sort((a, b) => a - b));
  }
  return (
    <fieldset className="meses-fieldset">
      <legend>{etiqueta}</legend>
      <div className="meses-grid">
        {MESES.map((nombre, i) => (
          <label key={nombre} className={`mes-chip${valor.includes(i + 1) ? ' mes-chip-activo' : ''}`}>
            <input type="checkbox" checked={valor.includes(i + 1)} onChange={() => alternar(i + 1)} />
            {nombre}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

// RF-251: carga de la ficha de cultivo (Especialista/Administrador -- el backend lo exige con
// requireValidator; la ficha nace "Pendiente" y la aprueba M-09). Mismo patrón que
// PublicarProductoForm: secciones con título, mismo selector de mapa y autocompletado de dirección.
// La ubicación en el mapa (RF-271) es un segundo paso del backend (POST /cultivos/:id/ubicacion): si
// ese paso falla la ficha ya quedó guardada, y el formulario ofrece reintentar solo la ubicación en
// vez de volver a crear la ficha.
function RegistrarFichaCultivoForm({ onRegistrada }: { onRegistrada: (ficha: FichaCultivoCreada, ubicada: boolean) => void }) {
  const [plantas, setPlantas] = useState<Planta[]>([]);
  const [plantaId, setPlantaId] = useState('');
  const [zonaCultivo, setZonaCultivo] = useState('');
  const [condicionesClimaticas, setCondicionesClimaticas] = useState('');
  const [tipoSuelo, setTipoSuelo] = useState('');
  const [altitudAprox, setAltitudAprox] = useState('');
  const [aguaNecesaria, setAguaNecesaria] = useState('');
  const [exposicionSolar, setExposicionSolar] = useState('');
  const [metodoPropagacion, setMetodoPropagacion] = useState(METODOS_PROPAGACION[0]);
  const [tiempoCrecimiento, setTiempoCrecimiento] = useState('');
  const [cuidados, setCuidados] = useState('');
  const [plagasComunes, setPlagasComunes] = useState('');
  const [mesesSiembra, setMesesSiembra] = useState<number[]>([]);
  const [mesesCosecha, setMesesCosecha] = useState<number[]>([]);
  const [epocaSiembra, setEpocaSiembra] = useState('');
  const [epocaCosecha, setEpocaCosecha] = useState('');
  const [recomendacionesSobreexplotacion, setRecomendacionesSobreexplotacion] = useState('');
  const [consejosRecoleccion, setConsejosRecoleccion] = useState('');
  const [fuente, setFuente] = useState('');
  const [coordenadas, setCoordenadas] = useState<{ lat: number; lon: number } | null>(null);
  const [resolviendoDireccion, setResolviendoDireccion] = useState(false);

  const [fichaGuardada, setFichaGuardada] = useState<FichaCultivoCreada | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { listarPlantas().then(setPlantas).catch(() => {}); }, []);

  function manejarCambioUbicacion(lat: number, lon: number) {
    setCoordenadas({ lat, lon });
    setResolviendoDireccion(true);
    direccionInversa(lat, lon)
      .then((direccion) => { if (direccion) setZonaCultivo(direccion); })
      .finally(() => setResolviendoDireccion(false));
  }

  async function manejarSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!fichaGuardada) {
      if (!plantaId) { setError('Elige la planta de la ficha.'); return; }
      if (!zonaCultivo.trim()) { setError('La zona de cultivo es obligatoria.'); return; }
    }
    setEnviando(true);
    try {
      let ficha = fichaGuardada;
      if (!ficha) {
        ficha = await registrarFichaCultivo({
          plantaId, zonaCultivo: zonaCultivo.trim(), condicionesClimaticas, tipoSuelo, altitudAprox, aguaNecesaria, exposicionSolar,
          epocaSiembra, metodoPropagacion, tiempoCrecimiento, cuidados, plagasComunes, epocaCosecha,
          recomendacionesSobreexplotacion, consejosRecoleccion, mesesSiembra, mesesCosecha, fuente,
        });
        setFichaGuardada(ficha);
      }
      if (coordenadas) {
        try {
          await registrarUbicacionCultivo(ficha.id, { zona: zonaCultivo.trim(), latitud: coordenadas.lat, longitud: coordenadas.lon });
        } catch (err) {
          setError(`La ficha se guardó, pero no se pudo registrar su ubicación en el mapa: ${err instanceof Error ? err.message : 'error desconocido'}. Puedes reintentar solo la ubicación.`);
          return;
        }
      }
      onRegistrada(ficha, !!coordenadas);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar la ficha. Revisa los campos obligatorios.');
    } finally {
      setEnviando(false);
    }
  }

  const bloqueado = !!fichaGuardada;

  return (
    <form onSubmit={manejarSubmit} className="formulario" style={{ maxWidth: 720 }}>
      <fieldset disabled={bloqueado} className="form-fieldset-plano">
        <div className="form-section">
          <h3 className="form-section-title">Planta y fuente</h3>
          <label>
            Planta
            <select value={plantaId} onChange={(e) => setPlantaId(e.target.value)} required>
              <option value="">Selecciona una planta del catálogo…</option>
              {plantas.map((p) => <option key={p.id} value={p.id}>{p.nombreComun} ({p.nombreCientifico})</option>)}
            </select>
          </label>
          <label>
            Fuente citable
            <input type="text" value={fuente} onChange={(e) => setFuente(e.target.value)} placeholder="Ej. Manual de cultivo de plantas medicinales, INIA 2019" required />
          </label>
          <p className="form-section-desc">Ningún dato agronómico se publica sin fuente y sin pasar por la validación de un especialista (RF-251).</p>
        </div>

        <div className="form-section">
          <h3 className="form-section-title">Condiciones de cultivo</h3>
          <label>Condiciones climáticas<input type="text" value={condicionesClimaticas} onChange={(e) => setCondicionesClimaticas(e.target.value)} placeholder="Ej. cálido y húmedo, 22–28 °C" /></label>
          <label>Tipo de suelo<input type="text" value={tipoSuelo} onChange={(e) => setTipoSuelo(e.target.value)} placeholder="Ej. franco-arcilloso, bien drenado" /></label>
          <label>Altitud aproximada<input type="text" value={altitudAprox} onChange={(e) => setAltitudAprox(e.target.value)} placeholder="Ej. 600–1200 m s. n. m." /></label>
          <label>Agua necesaria<input type="text" value={aguaNecesaria} onChange={(e) => setAguaNecesaria(e.target.value)} placeholder="Ej. riego moderado, sin encharcar" /></label>
          <label>Exposición solar<input type="text" value={exposicionSolar} onChange={(e) => setExposicionSolar(e.target.value)} placeholder="Ej. media sombra" /></label>
        </div>

        <div className="form-section">
          <h3 className="form-section-title">Siembra, cuidados y cosecha</h3>
          <label>
            Método de propagación
            <select value={metodoPropagacion} onChange={(e) => setMetodoPropagacion(e.target.value)}>
              {METODOS_PROPAGACION.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>
          <label>Tiempo aproximado de crecimiento<input type="text" value={tiempoCrecimiento} onChange={(e) => setTiempoCrecimiento(e.target.value)} placeholder="Ej. 18–24 meses hasta la primera cosecha" /></label>
          <label>Cuidados<textarea value={cuidados} onChange={(e) => setCuidados(e.target.value)} /></label>
          <label>Plagas y enfermedades comunes (y su prevención)<textarea value={plagasComunes} onChange={(e) => setPlagasComunes(e.target.value)} /></label>
          <label>Época de siembra (texto)<input type="text" value={epocaSiembra} onChange={(e) => setEpocaSiembra(e.target.value)} placeholder="Ej. inicio de la temporada de lluvias" /></label>
          <SelectorMeses etiqueta="Meses de siembra (calendario)" valor={mesesSiembra} onCambiar={setMesesSiembra} />
          <label>Época de cosecha (texto)<input type="text" value={epocaCosecha} onChange={(e) => setEpocaCosecha(e.target.value)} placeholder="Ej. fin de la temporada seca" /></label>
          <SelectorMeses etiqueta="Meses de cosecha (calendario)" valor={mesesCosecha} onCambiar={setMesesCosecha} />
        </div>

        <div className="form-section">
          <h3 className="form-section-title">Recolección responsable</h3>
          <label>Consejos de recolección<textarea value={consejosRecoleccion} onChange={(e) => setConsejosRecoleccion(e.target.value)} required /></label>
          <label>Recomendaciones contra la sobreexplotación<textarea value={recomendacionesSobreexplotacion} onChange={(e) => setRecomendacionesSobreexplotacion(e.target.value)} /></label>
        </div>

        <div className="form-section">
          <h3 className="form-section-title">Dónde se cultiva</h3>
          <p className="form-section-desc">Marca el punto en el mapa para que la ficha aparezca en el “Mapa de cultivo”. Si la planta está en riesgo de conservación, el sistema no publica las coordenadas exactas (RN-07).</p>
          <label>
            Zona / localidad de cultivo
            <input type="text" value={zonaCultivo} onChange={(e) => setZonaCultivo(e.target.value)} placeholder="Marca el punto en el mapa para autocompletar" required />
          </label>
          {resolviendoDireccion && <p className="comentario-meta">Resolviendo dirección…</p>}
          <SelectorUbicacionMapa plantaId={plantaId || undefined} onCambiarUbicacion={manejarCambioUbicacion} />
        </div>
      </fieldset>

      <div className="form-section">
        {fichaGuardada && (
          <p className="consent-box-ya-aceptado"><CheckCircle2 size={16} aria-hidden="true" /> Ficha guardada como “Pendiente”. Falta registrar su ubicación en el mapa.</p>
        )}
        <p className="comentario-meta">La ficha quedará “Pendiente” hasta que un especialista agrónomo o el administrador la apruebe en la bandeja de validación.</p>
        {error && <p className="error-formulario">{error}</p>}
        <Button type="submit" variant="primary" loading={enviando}>
          {enviando ? 'Guardando…' : bloqueado ? 'Reintentar ubicación' : 'Registrar ficha de cultivo'}
        </Button>
      </div>
    </form>
  );
}

export default RegistrarFichaCultivoForm;
