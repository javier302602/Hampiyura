import { ChangeEvent, FormEvent, useState } from 'react';
import { ImagePlus, MapPin, X } from 'lucide-react';
import { subirMedia, leerArchivoComoBase64 } from '../../m06-publicaciones/api/publicaciones.api';
import SelectorUbicacionMapa from '../../m03-cultivo/components/SelectorUbicacionMapa';
import Button from '../../../shared/ui/Button';
import { crearConsulta, TIPOS_CONSULTA, ETIQUETAS_TIPO_CONSULTA, type TipoConsulta, type Consulta } from '../api/consultas.api';
import { getSession } from '../../../shared/auth/session';

interface Props {
  onVerMisConsultas: () => void;
  onVolver: () => void;
}

// RF-263/265: accesible sin sesión -- el backend ya soporta el envío como visitante
// (attachUserIfPresent adjunta autorId solo si hay sesión).
function EnviarConsultaPage({ onVerMisConsultas, onVolver }: Props) {
  const [tipo, setTipo] = useState<TipoConsulta>('PreguntaGeneral');
  const [descripcion, setDescripcion] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviada, setEnviada] = useState<Consulta | null>(null);
  const [imagenes, setImagenes] = useState<string[]>([]);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [conUbicacion, setConUbicacion] = useState(false);
  const [coordenadas, setCoordenadas] = useState<{ lat: number; lon: number } | null>(null);
  const haySesion = !!getSession();

  // Fotos de la consulta (hasta 5): se suben a la plataforma igual que en las demás pantallas. Gratis: no depende de ningún plan.
  async function alElegirFotos(e: ChangeEvent<HTMLInputElement>) {
    const archivos = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (archivos.length === 0) return;
    if (imagenes.length + archivos.length > 5) { setError('Puedes adjuntar hasta 5 fotos.'); return; }
    setSubiendoFoto(true); setError(null);
    try {
      const nuevas: string[] = [];
      for (const a of archivos) nuevas.push((await subirMedia(a.name, await leerArchivoComoBase64(a))).url);
      setImagenes((prev) => [...prev, ...nuevas]);
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo subir la foto.'); }
    finally { setSubiendoFoto(false); }
  }

  async function manejarSubmit(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const creada = await crearConsulta({ tipo, descripcion, imagenes: imagenes.length ? imagenes : undefined, latitud: conUbicacion ? coordenadas?.lat : undefined, longitud: conUbicacion ? coordenadas?.lon : undefined });
      setEnviada(creada);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar la consulta.');
    } finally {
      setEnviando(false);
    }
  }

  if (enviada) {
    return (
      <section>
        <Button variant="ghost" onClick={onVolver}>← Volver al catálogo</Button>
        <h2>Consulta enviada</h2>
        <p className="sello-verificado">✔ Tu consulta ("{ETIQUETAS_TIPO_CONSULTA[enviada.tipo]}") fue recibida{enviada.prioridad === 'Alta' && ' con prioridad alta'}.</p>
        {haySesion ? (
          <>
            <p>Puedes seguir el estado de esta consulta y del resto de las tuyas en cualquier momento.</p>
            <button onClick={onVerMisConsultas}>Ver mis consultas</button>
          </>
        ) : (
          <p className="advertencia-no-verificado">
            ⚠ Enviaste esta consulta sin una cuenta. El sistema no guarda a qué visitante pertenece, así que
            <strong> no vas a poder ver su estado ni su respuesta después</strong> -- si quieres darle seguimiento,
            crea una cuenta antes de enviar tu próxima consulta.
          </p>
        )}
      </section>
    );
  }

  return (
    <section>
      <Button variant="ghost" onClick={onVolver}>← Volver al catálogo</Button>
      <h2>Contacto / Ayuda</h2>
      <p>Envíanos una consulta, reporte o solicitud. {!haySesion && 'Puedes hacerlo sin crear una cuenta.'}</p>
      <form onSubmit={manejarSubmit} className="formulario">
        <label>
          Tipo de consulta
          <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoConsulta)}>
            {TIPOS_CONSULTA.map((t) => <option key={t} value={t}>{ETIQUETAS_TIPO_CONSULTA[t]}</option>)}
          </select>
        </label>
        <label>
          Descripción
          <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} required />
        </label>
        <div className="form-section">
          <h3 className="form-section-title">Fotos y ubicación (opcional)</h3>
          <p className="form-section-desc">Sirven para explicar mejor el problema (por ejemplo, una hoja enferma o dónde está la planta). Adjuntarlas es gratis y no depende de ningún plan.</p>
          <label>
            Fotos (hasta 5)
            <input type="file" accept="image/*" multiple onChange={alElegirFotos} disabled={subiendoFoto || imagenes.length >= 5} />
          </label>
          {subiendoFoto && <p className="comentario-meta">Subiendo fotos…</p>}
          {imagenes.length > 0 && (
            <div className="galeria-imagenes">
              {imagenes.map((url) => (
                <div key={url}>
                  <img src={url} alt="Foto adjunta a la consulta" />
                  <button type="button" className="icon-btn" aria-label="Quitar foto" onClick={() => setImagenes((prev) => prev.filter((u) => u !== url))}><X size={14} aria-hidden="true" /></button>
                </div>
              ))}
            </div>
          )}
          {!conUbicacion ? (
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setConUbicacion(true)}><MapPin size={15} aria-hidden="true" /> Agregar ubicación</button>
          ) : (
            <>
              <SelectorUbicacionMapa permitirGps onCambiarUbicacion={(lat, lon) => setCoordenadas({ lat, lon })} />
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setConUbicacion(false); setCoordenadas(null); }}>Quitar la ubicación</button>
            </>
          )}
        </div>
        {!haySesion && (
          <p className="comentario-meta">
            No tienes una sesión activa: esta consulta se enviará como visitante y no vas a poder consultar su
            estado después (no hay forma de asociarla contigo sin una cuenta).
          </p>
        )}
        {error && <p className="error-formulario">{error}</p>}
        <button type="submit" disabled={enviando || subiendoFoto || !descripcion.trim() || (conUbicacion && !coordenadas)}>{enviando ? 'Enviando…' : 'Enviar consulta'}</button>
      </form>
    </section>
  );
}

export default EnviarConsultaPage;
