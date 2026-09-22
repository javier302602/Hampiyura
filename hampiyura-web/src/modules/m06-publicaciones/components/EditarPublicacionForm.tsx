import { ChangeEvent, FormEvent, useState } from 'react';
import { TIPOS_CONOCIMIENTO, editarPublicacion, subirMedia, leerArchivoComoBase64, type Publicacion, type PublicacionCreada, type TipoConocimiento } from '../api/publicaciones.api';

interface Props {
  publicacion: Publicacion;
  onGuardada: (actualizada: PublicacionCreada) => void;
  onCancelar: () => void;
}

function EditarPublicacionForm({ publicacion, onGuardada, onCancelar }: Props) {
  const [nombreComun, setNombreComun] = useState(publicacion.nombreComun);
  const [descripcion, setDescripcion] = useState(publicacion.descripcion);
  const [enfermedadesTratadas, setEnfermedadesTratadas] = useState(publicacion.enfermedadesTratadas);
  const [formaPreparacion, setFormaPreparacion] = useState(publicacion.formaPreparacion);
  const [tipoConocimiento, setTipoConocimiento] = useState<TipoConocimiento>(publicacion.tipoConocimiento);
  const [fuente, setFuente] = useState(publicacion.fuente.valor);
  const [imagenes, setImagenes] = useState<string[]>(publicacion.imagenes);
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function manejarSeleccionArchivo(e: ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;
    setSubiendoImagen(true);
    setError(null);
    try {
      const base64 = await leerArchivoComoBase64(archivo);
      const { url } = await subirMedia(archivo.name, base64);
      setImagenes((prev) => [...prev, url]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir la imagen.');
    } finally {
      setSubiendoImagen(false);
    }
  }

  function quitarImagen(url: string) { setImagenes((prev) => prev.filter((u) => u !== url)); }

  async function manejarSubmit(e: FormEvent) {
    e.preventDefault();
    if (!fuente.trim()) { setError('La fuente es obligatoria.'); return; }
    setEnviando(true);
    setError(null);
    try {
      const actualizada = await editarPublicacion(publicacion.id, { nombreComun, descripcion, enfermedadesTratadas, formaPreparacion, imagenes, tipoConocimiento, fuente });
      onGuardada(actualizada);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la edición.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={manejarSubmit} className="formulario">
      <p className="advertencia-no-verificado">
        ⚠ Al guardar estos cambios, la publicación volverá a estado <strong>Pendiente</strong> y dejará de mostrarse en el feed público hasta que un especialista la revise nuevamente.
      </p>
      <label>
        Nombre común
        <input type="text" value={nombreComun} onChange={(e) => setNombreComun(e.target.value)} required />
      </label>
      <label>
        Descripción
        <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} required />
      </label>
      <label>
        Enfermedades que ayuda a tratar
        <textarea value={enfermedadesTratadas} onChange={(e) => setEnfermedadesTratadas(e.target.value)} required />
      </label>
      <label>
        Forma de preparación
        <textarea value={formaPreparacion} onChange={(e) => setFormaPreparacion(e.target.value)} required />
      </label>

      <label>
        Fotos
        <input type="file" accept="image/*" onChange={manejarSeleccionArchivo} disabled={subiendoImagen} />
      </label>
      {subiendoImagen && <p className="comentario-meta">Subiendo imagen…</p>}
      {imagenes.length > 0 && (
        <div className="galeria-imagenes">
          {imagenes.map((url) => (
            <div key={url}>
              <img src={url} alt="Foto de la publicación" />
              <button type="button" onClick={() => quitarImagen(url)}>Quitar</button>
            </div>
          ))}
        </div>
      )}

      <label>
        Tipo de conocimiento
        <select value={tipoConocimiento} onChange={(e) => setTipoConocimiento(e.target.value as TipoConocimiento)}>
          {TIPOS_CONOCIMIENTO.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </label>
      <label>
        Fuente citada
        <input type="text" value={fuente} onChange={(e) => setFuente(e.target.value)} required />
      </label>

      {error && <p className="error-formulario">{error}</p>}
      <div style={{ display: 'flex', gap: '.5rem' }}>
        <button type="submit" disabled={enviando || subiendoImagen}>{enviando ? 'Guardando…' : 'Guardar cambios (vuelve a Pendiente)'}</button>
        <button type="button" onClick={onCancelar}>Cancelar</button>
      </div>
    </form>
  );
}

export default EditarPublicacionForm;
