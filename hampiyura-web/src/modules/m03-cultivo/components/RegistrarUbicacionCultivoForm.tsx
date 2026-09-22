import { FormEvent, useState } from 'react';
import SelectorUbicacionMapa from './SelectorUbicacionMapa';
import { registrarUbicacionCultivo } from '../api/mapa-cultivo.api';

interface Props {
  cultivoId: string;
  plantaId: string;
  onRegistrada: () => void;
}

function RegistrarUbicacionCultivoForm({ cultivoId, plantaId, onRegistrada }: Props) {
  const [zona, setZona] = useState('');
  const [coordenadas, setCoordenadas] = useState<{ lat: number; lon: number } | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function manejarSubmit(e: FormEvent) {
    e.preventDefault();
    if (!zona.trim()) { setError('La zona es obligatoria.'); return; }
    setEnviando(true);
    setError(null);
    try {
      await registrarUbicacionCultivo(cultivoId, {
        zona,
        // Coordenadas exactas: se guardan tal cual se seleccionaron en el mapa (RN-07 no cambia
        // acá -- la exactitud es para quien registra, la vista pública es la que oculta el dato
        // si la planta está en riesgo, ver listarMapaCultivo/ListarMapaCultivoUseCase).
        latitud: coordenadas?.lat,
        longitud: coordenadas?.lon,
      });
      onRegistrada();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar la ubicación. Intenta nuevamente.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={manejarSubmit} className="formulario">
      <label>
        Zona / localidad
        <input type="text" value={zona} onChange={(e) => setZona(e.target.value)} placeholder="Ej. Chanchamayo, Junín" required />
      </label>

      <SelectorUbicacionMapa plantaId={plantaId} onCambiarUbicacion={(lat, lon) => setCoordenadas({ lat, lon })} />

      {error && <p className="error-formulario">{error}</p>}
      <button type="submit" disabled={enviando}>{enviando ? 'Guardando…' : 'Registrar ubicación'}</button>
    </form>
  );
}

export default RegistrarUbicacionCultivoForm;
