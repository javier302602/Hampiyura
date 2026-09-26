import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { proponerPlanta, type Planta } from '../api/plantas.api';
import { subirMedia, leerArchivoComoBase64 } from '../../m06-publicaciones/api/publicaciones.api';
import { listarUsos, TIPOS_PARTE, TIPOS_CONOCIMIENTO, type Uso, type TipoConocimiento } from '../../m04-usos-partes/api/partes-uso.api';
import SelectorUbicacionMapa from '../../m03-cultivo/components/SelectorUbicacionMapa';
import { direccionInversa } from '../../m03-cultivo/api/geocoding.api';
import Button from '../../../shared/ui/Button';

// Opciones más comunes de hábitat. Se guarda el texto de la opción elegida (Planta.habitat sigue siendo
// texto, así que el catálogo y la búsqueda no cambian); "Otro" abre un campo libre y se guarda lo escrito.
export const HABITATS = [
  'Selva tropical',
  'Bosque primario',
  'Bosque secundario',
  'Orilla de río / humedal',
  'Zona de altura / ceja de selva',
  'Cultivado / huerto',
] as const;
const HABITAT_OTRO = '__otro__';

// Frente 4 (auditoría): "Proponer planta" abierta a cualquier usuario autenticado; queda "Pendiente"
// hasta que pase por la bandeja de M-09. Ahora incluye (RF-255) la parte medicinal y el uso, que se
// registran por el flujo normal de M-04: también quedan "Pendiente" y NUNCA se muestran como uso
// verificado hasta que un especialista los apruebe (RF-257).
function ProponerPlantaForm({ onPropuesta }: { onPropuesta: (creada: Planta, conUso: boolean) => void }) {
  const [nombreComun, setNombreComun] = useState('');
  const [nombreCientifico, setNombreCientifico] = useState('');
  const [familia, setFamilia] = useState('');
  const [region, setRegion] = useState('');
  const [coordenadas, setCoordenadas] = useState<{ lat: number; lon: number } | null>(null);
  const [resolviendoDireccion, setResolviendoDireccion] = useState(false);
  const [habitatOpcion, setHabitatOpcion] = useState('');
  const [habitatOtro, setHabitatOtro] = useState('');

  const [usos, setUsos] = useState<Uso[]>([]);
  const [parte, setParte] = useState<string>(TIPOS_PARTE[0]);
  const [parteDetalle, setParteDetalle] = useState('');
  const [usoId, setUsoId] = useState('');
  const [motivoUso, setMotivoUso] = useState('');
  const [tipoConocimiento, setTipoConocimiento] = useState<TipoConocimiento>('Tradicional');
  const [fuente, setFuente] = useState('');
  const [contraindicaciones, setContraindicaciones] = useState('');

  const [imagenPrincipal, setImagenPrincipal] = useState('');
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listarUsos().then((lista) => {
      // "Otro" siempre al final del selector, sin importar el orden en que lo devuelva el catálogo.
      const ordenados = [...lista].sort((a, b) => (a.nombre === 'Otro' ? 1 : b.nombre === 'Otro' ? -1 : a.nombre.localeCompare(b.nombre, 'es')));
      setUsos(ordenados);
    }).catch(() => setError('No se pudo cargar el catálogo de usos.'));
  }, []);

  // Al soltar el pin (clic, arrastre o GPS) se autocompleta "Región / área" con la dirección real del
  // punto -- igual que la localidad en Publicar producto. Sigue siendo editable a mano.
  function manejarCambioUbicacion(lat: number, lon: number) {
    setCoordenadas({ lat, lon });
    setResolviendoDireccion(true);
    direccionInversa(lat, lon)
      .then((direccion) => { if (direccion) setRegion(direccion); })
      .catch(() => {})
      .finally(() => setResolviendoDireccion(false));
  }

  async function manejarSeleccionArchivo(e: ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;
    setSubiendoFoto(true);
    setError(null);
    try {
      const base64 = await leerArchivoComoBase64(archivo);
      const { url } = await subirMedia(archivo.name, base64);
      setImagenPrincipal(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir la fotografía.');
    } finally {
      setSubiendoFoto(false);
    }
  }

  const noSeraVerificado = tipoConocimiento !== 'Científico';

  async function manejarSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const habitat = habitatOpcion === HABITAT_OTRO ? habitatOtro.trim() : habitatOpcion;
    if (!habitat) { setError(habitatOpcion === HABITAT_OTRO ? 'Escribe cuál es el hábitat.' : 'Elige el hábitat de la planta.'); return; }
    if (!usoId) { setError('Elige para qué se usa la planta (si no está en la lista, elige "Otro" y descríbelo).'); return; }
    if (parte === 'Otra' && !parteDetalle.trim()) { setError('Escribe cuál es la parte de la planta.'); return; }
    setEnviando(true);
    try {
      const creada = await proponerPlanta({
        nombreComun, nombreCientifico, familia, region, habitat,
        imagenPrincipal: imagenPrincipal || undefined,
        latitud: coordenadas?.lat, longitud: coordenadas?.lon,
        parteUso: {
          parte, parteDetalle: parte === 'Otra' ? parteDetalle.trim() : undefined,
          usoId, motivoUso, tipoConocimiento, fuente,
          contraindicaciones: contraindicaciones.trim() || undefined,
        },
      });
      onPropuesta(creada, true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar la propuesta. Revisa los campos obligatorios.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={manejarSubmit} className="formulario" style={{ maxWidth: 720 }}>
      <div className="form-section">
        <h3 className="form-section-title">Datos de la planta</h3>
        <label>
          Nombre común
          <input type="text" value={nombreComun} onChange={(e) => setNombreComun(e.target.value)} placeholder="Ej. Chuchuhuasi" required />
        </label>
        <label>
          Nombre científico
          <input type="text" value={nombreCientifico} onChange={(e) => setNombreCientifico(e.target.value)} placeholder="Ej. Maytenus macrocarpa" required />
        </label>
        <label>
          Familia botánica
          <input type="text" value={familia} onChange={(e) => setFamilia(e.target.value)} placeholder="Ej. Celastraceae" required />
        </label>
      </div>

      <div className="form-section">
        <h3 className="form-section-title">Dónde crece</h3>
        <p className="form-section-desc">
          Usa tu ubicación actual (el navegador te pedirá permiso) o busca la localidad y marca el punto en el mapa. La ubicación exacta
          solo la ve el equipo que revisa la propuesta: no se publica en el catálogo.
        </p>
        <SelectorUbicacionMapa permitirGps onCambiarUbicacion={manejarCambioUbicacion} />
        <label>
          Región / área de crecimiento
          <input type="text" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="Se completa al marcar el mapa, o escríbela: Ej. Selva central del Perú, 200-800 msnm" required />
        </label>
        {resolviendoDireccion && <p className="comentario-meta">Resolviendo dirección…</p>}
        <label>
          Hábitat
          <select value={habitatOpcion} onChange={(e) => setHabitatOpcion(e.target.value)} required>
            <option value="">Elige el hábitat…</option>
            {HABITATS.map((h) => <option key={h} value={h}>{h}</option>)}
            <option value={HABITAT_OTRO}>Otro (escribirlo)</option>
          </select>
        </label>
        {habitatOpcion === HABITAT_OTRO && (
          <label>
            ¿Cuál es el hábitat?
            <input type="text" value={habitatOtro} onChange={(e) => setHabitatOtro(e.target.value)} placeholder="Ej. Pastizal de altura, chacra de yuca…" required />
          </label>
        )}
      </div>

      <div className="form-section">
        <h3 className="form-section-title">Parte medicinal y uso</h3>
        <label>
          Parte de la planta que se usa
          <select value={parte} onChange={(e) => setParte(e.target.value)}>
            {TIPOS_PARTE.map((p) => <option key={p} value={p}>{p === 'Otra' ? 'Otra (escribirla)' : p}</option>)}
          </select>
        </label>
        {parte === 'Otra' && (
          <label>
            ¿Cuál es la parte?
            <input type="text" value={parteDetalle} onChange={(e) => setParteDetalle(e.target.value)} placeholder="Ej. Látex, yema, resina…" required />
          </label>
        )}
        <label>
          Uso / finalidad
          <select value={usoId} onChange={(e) => setUsoId(e.target.value)} required>
            <option value="">Elige para qué se usa…</option>
            {usos.map((u) => <option key={u.id} value={u.id}>{u.nombre === 'Otro' ? 'Otro (descríbelo abajo)' : u.nombre}</option>)}
          </select>
        </label>
        <label>
          ¿Para qué se usa y por qué?
          <textarea value={motivoUso} onChange={(e) => setMotivoUso(e.target.value)} placeholder="Ej. Se toma en infusión de hojas secas para la inflamación; en mi comunidad se usa desde hace generaciones." required />
        </label>
        <label>
          Tipo de conocimiento
          <select value={tipoConocimiento} onChange={(e) => setTipoConocimiento(e.target.value as TipoConocimiento)}>
            {TIPOS_CONOCIMIENTO.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label>
          Fuente (de dónde lo sabes)
          <input type="text" value={fuente} onChange={(e) => setFuente(e.target.value)} placeholder="Ej. saber de mi comunidad, entrevista con un curandero, libro o artículo…" required />
        </label>
        <label>
          Contraindicaciones (opcional — solo si tu fuente las menciona)
          <input type="text" value={contraindicaciones} onChange={(e) => setContraindicaciones(e.target.value)} />
        </label>
        {noSeraVerificado ? (
          <p className="advertencia-no-verificado">
            ⚠ Con "{tipoConocimiento}", este uso <strong>nunca</strong> se mostrará como verificado científicamente, ni siquiera cuando un especialista lo apruebe.
          </p>
        ) : (
          <p className="nota-cientifico">Con "Científico", este uso solo podrá mostrarse como verificado después de que un especialista lo revise y lo apruebe.</p>
        )}
      </div>

      <div className="form-section">
        <h3 className="form-section-title">Fotografía</h3>
        <label>
          Fotografía (opcional)
          <input type="file" accept="image/*" onChange={manejarSeleccionArchivo} disabled={subiendoFoto} />
        </label>
        {subiendoFoto && <p className="comentario-meta">Subiendo imagen…</p>}
        {imagenPrincipal && <img src={imagenPrincipal} alt="Vista previa" style={{ width: 160, height: 160, objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />}
      </div>

      <div className="form-section">
        <p className="comentario-meta">
          Tu propuesta —la planta y su parte medicinal/uso— quedará "Pendiente" hasta que el equipo y un especialista la revisen. No aparecerá
          en el catálogo público, ni como uso verificado, hasta entonces.
        </p>
        {error && <p className="error-formulario">{error}</p>}
        <Button type="submit" variant="primary" loading={enviando} disabled={subiendoFoto}>
          {enviando ? 'Enviando…' : 'Proponer planta'}
        </Button>
      </div>
    </form>
  );
}

export default ProponerPlantaForm;
