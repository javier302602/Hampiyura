import { ChangeEvent, FormEvent, useState } from 'react';
import { TIPOS_CONOCIMIENTO, crearPublicacion, subirMedia, leerArchivoComoBase64, type TipoConocimiento } from '../api/publicaciones.api';

interface Props {
  plantaId: string;
  onCreada: () => void;
}

function CrearPublicacionForm({ plantaId, onCreada }: Props) {
  const [nombreComun, setNombreComun] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [enfermedadesTratadas, setEnfermedadesTratadas] = useState('');
  const [formaPreparacion, setFormaPreparacion] = useState('');
  const [tipoConocimiento, setTipoConocimiento] = useState<TipoConocimiento>('Tradicional');
  const [fuente, setFuente] = useState('');
  const [imagenes, setImagenes] = useState<string[]>([]);
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const noSeraVerificado = tipoConocimiento === 'Tradicional' || tipoConocimiento === 'Pendiente';

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
      await crearPublicacion({ plantaId, nombreComun, descripcion, enfermedadesTratadas, formaPreparacion, imagenes, tipoConocimiento, fuente });
      onCreada();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la publicación. Revisa los campos obligatorios.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={manejarSubmit} className="formulario">
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
        Fotos (opcional)
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

      {noSeraVerificado ? (
        <p className="advertencia-no-verificado">
          ⚠ Con "{tipoConocimiento}", esta publicación <strong>nunca</strong> se mostrará como verificada científicamente — ni siquiera si un especialista la aprueba. Solo el conocimiento "Científico" ya validado puede mostrarse como verificado.
        </p>
      ) : (
        <p className="nota-cientifico">Con "Científico", esta publicación podrá mostrarse como verificada, pero solo después de que un especialista la apruebe (queda "Pendiente de validar" hasta entonces).</p>
      )}

      <label>
        Fuente citada
        <input type="text" value={fuente} onChange={(e) => setFuente(e.target.value)} placeholder="Ej. entrevista con portador de conocimiento, publicación científica…" required />
      </label>

      <p className="comentario-meta">Tu publicación quedará "Pendiente" hasta que un especialista la revise; no será visible en el feed público hasta entonces.</p>

      {error && <p className="error-formulario">{error}</p>}
      <button type="submit" disabled={enviando || subiendoImagen}>{enviando ? 'Publicando…' : 'Publicar'}</button>
    </form>
  );
}

export default CrearPublicacionForm;
