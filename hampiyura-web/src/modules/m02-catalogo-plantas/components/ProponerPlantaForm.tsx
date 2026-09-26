import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
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

// Una planta suele tener varias partes con usos distintos. Máximo 8: hay 8 tipos de parte (hoja, fruto, raíz,
// corteza, tallo, flor, semilla, otra), así que más bloques solo serían repeticiones. Mismo tope en el backend.
export const MAX_BLOQUES = 8;
interface Bloque {
  clave: number; parte: string; parteDetalle: string; usoId: string; motivoUso: string;
  tipoConocimiento: TipoConocimiento; fuente: string; contraindicaciones: string;
}
const nuevoBloque = (clave: number): Bloque => ({ clave, parte: TIPOS_PARTE[0], parteDetalle: '', usoId: '', motivoUso: '', tipoConocimiento: 'Tradicional', fuente: '', contraindicaciones: '' });

// Texto de advertencia por tipo de conocimiento. Dice exactamente lo que el sistema cumple: aprobar en moderación
// (M-09) NO alcanza para mostrar un uso como verificado; hace falta la validación científica registrada por el equipo.
export function AvisoVerificacion({ tipo }: { tipo: string }) {
  // "Pendiente" no puede pasar por la validación científica (no se sabe de qué tipo de conocimiento se trata): se pide elegir.
  if (tipo === 'Pendiente') {
    return <p className="advertencia-no-verificado">⚠ Con "Pendiente", este uso no se muestra como verificado. Para que pueda pasar por la validación científica del equipo, elige si es conocimiento Tradicional, Documentado o Científico.</p>;
  }
  // Tradicional, Documentado y Científico comparten el MISMO camino a "verificado": declarar "Científico" aquí no es un atajo.
  return (
    <p className="advertencia-no-verificado">
      ⚠ Con "{tipo}", este uso no se muestra como verificado a menos que pase por el proceso de validación científica real del equipo (especialista + evidencia registrada). La aprobación normal de moderación no alcanza para eso{tipo === 'Científico' ? ', ni tampoco declararlo "Científico" al proponerlo' : ''}.
    </p>
  );
}

// Frente 4 (auditoría): "Proponer planta" abierta a cualquier usuario autenticado; queda "Pendiente" hasta
// que pase por la bandeja de M-09. Incluye (RF-255) una o VARIAS partes medicinales con su uso: cada bloque se
// registra por el flujo normal de M-04 como su propio registro Planta→Parte→Uso, también "Pendiente", y entra a
// moderación por separado. NUNCA se muestran como verificados (RF-257).
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
  const contador = useRef(1);
  const [bloques, setBloques] = useState<Bloque[]>([nuevoBloque(0)]);

  const [imagenPrincipal, setImagenPrincipal] = useState('');
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listarUsos().then((lista) => {
      // "Otro" siempre al final del selector, sin importar el orden en que lo devuelva el catálogo.
      setUsos([...lista].sort((a, b) => (a.nombre === 'Otro' ? 1 : b.nombre === 'Otro' ? -1 : a.nombre.localeCompare(b.nombre, 'es'))));
    }).catch(() => setError('No se pudo cargar el catálogo de usos.'));
  }, []);

  function actualizarBloque(clave: number, cambios: Partial<Bloque>) { setBloques((prev) => prev.map((b) => (b.clave === clave ? { ...b, ...cambios } : b))); }
  function agregarBloque() { setBloques((prev) => (prev.length >= MAX_BLOQUES ? prev : [...prev, nuevoBloque(contador.current++)])); }
  // Mínimo 1 bloque siempre: el botón de quitar solo aparece cuando hay más de uno.
  function quitarBloque(clave: number) { setBloques((prev) => (prev.length <= 1 ? prev : prev.filter((b) => b.clave !== clave))); }

  // Al soltar el pin (clic, arrastre o GPS) se autocompleta "Región / área" con la dirección real del punto.
  function manejarCambioUbicacion(lat: number, lon: number) {
    setCoordenadas({ lat, lon });
    setResolviendoDireccion(true);
    direccionInversa(lat, lon).then((d) => { if (d) setRegion(d); }).catch(() => {}).finally(() => setResolviendoDireccion(false));
  }

  async function manejarSeleccionArchivo(e: ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;
    setSubiendoFoto(true); setError(null);
    try { setImagenPrincipal((await subirMedia(archivo.name, await leerArchivoComoBase64(archivo))).url); }
    catch (err) { setError(err instanceof Error ? err.message : 'No se pudo subir la fotografía.'); }
    finally { setSubiendoFoto(false); }
  }

  async function manejarSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const habitat = habitatOpcion === HABITAT_OTRO ? habitatOtro.trim() : habitatOpcion;
    if (!habitat) { setError(habitatOpcion === HABITAT_OTRO ? 'Escribe cuál es el hábitat.' : 'Elige el hábitat de la planta.'); return; }
    if (bloques.length === 0) { setError('Agrega al menos una parte medicinal.'); return; }
    const vistas = new Set<string>();
    for (let i = 0; i < bloques.length; i++) {
      const b = bloques[i];
      if (!b.usoId) { setError(`Parte medicinal ${i + 1}: elige para qué se usa (si no está en la lista, elige "Otro" y descríbelo).`); return; }
      if (b.parte === 'Otra' && !b.parteDetalle.trim()) { setError(`Parte medicinal ${i + 1}: escribe cuál es la parte de la planta.`); return; }
      const combinacion = `${b.parte}|${b.parte === 'Otra' ? b.parteDetalle.trim().toLowerCase() : ''}|${b.usoId}`;
      if (vistas.has(combinacion)) { setError(`Parte medicinal ${i + 1}: ya agregaste esa misma parte con ese mismo uso. Cámbiale el uso o quítala.`); return; }
      vistas.add(combinacion);
    }
    setEnviando(true);
    try {
      const creada = await proponerPlanta({
        nombreComun, nombreCientifico, familia, region, habitat,
        imagenPrincipal: imagenPrincipal || undefined,
        latitud: coordenadas?.lat, longitud: coordenadas?.lon,
        partesUso: bloques.map((b) => ({
          parte: b.parte, parteDetalle: b.parte === 'Otra' ? b.parteDetalle.trim() : undefined,
          usoId: b.usoId, motivoUso: b.motivoUso, tipoConocimiento: b.tipoConocimiento, fuente: b.fuente,
          contraindicaciones: b.contraindicaciones.trim() || undefined,
        })),
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
        <h3 className="form-section-title">Partes medicinales y usos</h3>
        <p className="form-section-desc">
          Una misma planta suele servir de varias formas (por ejemplo, la hoja para una cosa y la raíz para otra). Agrega un bloque por cada parte y uso; cada uno se revisa por separado.
        </p>
        {bloques.map((b, i) => (
          <fieldset key={b.clave} className="bloque-parte" aria-label={`Parte medicinal ${i + 1}`}>
            <div className="bloque-parte-cabecera">
              <legend>Parte medicinal {i + 1}</legend>
              {bloques.length > 1 && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => quitarBloque(b.clave)} aria-label={`Quitar la parte medicinal ${i + 1}`}>
                  <Trash2 size={15} aria-hidden="true" /> Quitar
                </button>
              )}
            </div>
            <label>
              Parte de la planta que se usa
              <select value={b.parte} onChange={(e) => actualizarBloque(b.clave, { parte: e.target.value })}>
                {TIPOS_PARTE.map((p) => <option key={p} value={p}>{p === 'Otra' ? 'Otra (escribirla)' : p}</option>)}
              </select>
            </label>
            {b.parte === 'Otra' && (
              <label>
                ¿Cuál es la parte?
                <input type="text" value={b.parteDetalle} onChange={(e) => actualizarBloque(b.clave, { parteDetalle: e.target.value })} placeholder="Ej. Látex, yema, resina…" required />
              </label>
            )}
            <label>
              Uso / finalidad
              <select value={b.usoId} onChange={(e) => actualizarBloque(b.clave, { usoId: e.target.value })} required>
                <option value="">Elige para qué se usa…</option>
                {usos.map((u) => <option key={u.id} value={u.id}>{u.nombre === 'Otro' ? 'Otro (descríbelo abajo)' : u.nombre}</option>)}
              </select>
            </label>
            <label>
              ¿Para qué se usa y por qué?
              <textarea value={b.motivoUso} onChange={(e) => actualizarBloque(b.clave, { motivoUso: e.target.value })} placeholder="Ej. Se toma en infusión de hojas secas para la inflamación; en mi comunidad se usa desde hace generaciones." required />
            </label>
            <label>
              Tipo de conocimiento
              <select value={b.tipoConocimiento} onChange={(e) => actualizarBloque(b.clave, { tipoConocimiento: e.target.value as TipoConocimiento })}>
                {TIPOS_CONOCIMIENTO.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label>
              Fuente (de dónde lo sabes)
              <input type="text" value={b.fuente} onChange={(e) => actualizarBloque(b.clave, { fuente: e.target.value })} placeholder="Ej. saber de mi comunidad, entrevista con un curandero, libro o artículo…" required />
            </label>
            <label>
              Contraindicaciones (opcional — solo si tu fuente las menciona)
              <input type="text" value={b.contraindicaciones} onChange={(e) => actualizarBloque(b.clave, { contraindicaciones: e.target.value })} />
            </label>
            <AvisoVerificacion tipo={b.tipoConocimiento} />
          </fieldset>
        ))}
        <div>
          <Button type="button" variant="secondary" iconLeft={<Plus size={16} aria-hidden="true" />} onClick={agregarBloque} disabled={bloques.length >= MAX_BLOQUES}>
            Agregar otra parte medicinal
          </Button>
          <p className="comentario-meta" style={{ marginTop: 'var(--space-2)' }}>
            {bloques.length >= MAX_BLOQUES ? `Llegaste al máximo de ${MAX_BLOQUES} partes por propuesta.` : `${bloques.length} de ${MAX_BLOQUES} partes. Mínimo 1.`}
          </p>
        </div>
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
          Tu propuesta —la planta y cada parte medicinal/uso— quedará "Pendiente" hasta que el equipo y un especialista la revisen. No aparecerá
          en el catálogo público, ni como uso verificado, hasta entonces.
        </p>
        {error && <p className="error-formulario" role="alert">{error}</p>}
        <Button type="submit" variant="primary" loading={enviando} disabled={subiendoFoto}>
          {enviando ? 'Enviando…' : 'Proponer planta'}
        </Button>
      </div>
    </form>
  );
}

export default ProponerPlantaForm;
