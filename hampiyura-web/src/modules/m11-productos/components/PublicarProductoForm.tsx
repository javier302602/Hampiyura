import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { listarPlantas, type Planta } from '../../m02-catalogo-plantas/api/plantas.api';
import { publicarProducto, verificarAfirmaciones, subirMedia, leerArchivoComoBase64, type Producto } from '../api/productos.api';

function PublicarProductoForm({ onPublicado }: { onPublicado: (creado: Producto) => void }) {
  const [plantas, setPlantas] = useState<Planta[]>([]);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [plantasIds, setPlantasIds] = useState<string[]>([]);
  const [ingredientes, setIngredientes] = useState('');
  const [presentacion, setPresentacion] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [precioReferencial, setPrecioReferencial] = useState('');
  const [fotografias, setFotografias] = useState<string[]>([]);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [localidad, setLocalidad] = useState('');
  const [informacionProceso, setInformacionProceso] = useState('');
  const [fechaElaboracion, setFechaElaboracion] = useState('');
  const [contactoVendedor, setContactoVendedor] = useState('');
  const [requiereRevisionReforzada, setRequiereRevisionReforzada] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { listarPlantas().then(setPlantas).catch(() => {}); }, []);

  // RF-274: reconsulta la misma detección del backend cada vez que cambia un campo de texto
  // relevante, para avisar ANTES de que el usuario intente enviar el formulario.
  useEffect(() => {
    const timeout = setTimeout(() => {
      verificarAfirmaciones({ nombre, descripcion, informacionProceso, ingredientes })
        .then((r) => setRequiereRevisionReforzada(r.requiereRevisionReforzada))
        .catch(() => {});
    }, 400);
    return () => clearTimeout(timeout);
  }, [nombre, descripcion, informacionProceso, ingredientes]);

  function alternarPlanta(id: string) {
    setPlantasIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
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
      setFotografias((prev) => [...prev, url]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir la fotografía.');
    } finally {
      setSubiendoFoto(false);
    }
  }
  function quitarFoto(url: string) { setFotografias((prev) => prev.filter((u) => u !== url)); }

  async function manejarSubmit(e: FormEvent) {
    e.preventDefault();
    if (plantasIds.length === 0) { setError('Selecciona al menos una planta utilizada.'); return; }
    if (requiereRevisionReforzada) {
      const continuar = window.confirm('El texto ingresado contiene afirmaciones que activarán una revisión reforzada por parte del equipo (RF-274) antes de aprobarse. ¿Deseas publicar de todas formas?');
      if (!continuar) return;
    }
    setEnviando(true);
    setError(null);
    try {
      const creado = await publicarProducto({
        nombre, descripcion: descripcion.trim() || undefined, plantasIds, ingredientes: ingredientes.trim() || undefined,
        presentacion: presentacion.trim() || undefined, cantidad: cantidad.trim() || undefined,
        precioReferencial: precioReferencial.trim() || undefined, fotografias, localidad, informacionProceso,
        fechaElaboracion: fechaElaboracion || undefined, contactoVendedor,
      });
      onPublicado(creado);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo publicar el producto. Revisa los campos obligatorios.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={manejarSubmit} className="formulario">
      <label>
        Nombre del producto
        <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
      </label>
      <label>
        Descripción
        <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
      </label>

      <label>Plantas utilizadas</label>
      {plantas.length === 0 ? (
        <p>No hay plantas en el catálogo todavía.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.3rem' }}>
          {plantas.map((p) => (
            <label key={p.id} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '.4rem', fontWeight: 400 }}>
              <input type="checkbox" checked={plantasIds.includes(p.id)} onChange={() => alternarPlanta(p.id)} />
              {p.nombreComun}
            </label>
          ))}
        </div>
      )}

      <label>
        Ingredientes
        <textarea value={ingredientes} onChange={(e) => setIngredientes(e.target.value)} />
      </label>
      <label>
        Presentación
        <input type="text" value={presentacion} onChange={(e) => setPresentacion(e.target.value)} placeholder="Ej. frasco de vidrio 250ml" />
      </label>
      <label>
        Cantidad
        <input type="text" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
      </label>
      <label>
        Precio referencial (opcional)
        <input type="text" value={precioReferencial} onChange={(e) => setPrecioReferencial(e.target.value)} />
      </label>

      <label>
        Fotografías (opcional)
        <input type="file" accept="image/*" onChange={manejarSeleccionArchivo} disabled={subiendoFoto} />
      </label>
      {subiendoFoto && <p className="comentario-meta">Subiendo imagen…</p>}
      {fotografias.length > 0 && (
        <div className="galeria-imagenes">
          {fotografias.map((url) => (
            <div key={url}>
              <img src={url} alt="Foto del producto" />
              <button type="button" onClick={() => quitarFoto(url)}>Quitar</button>
            </div>
          ))}
        </div>
      )}

      <label>
        Localidad
        <input type="text" value={localidad} onChange={(e) => setLocalidad(e.target.value)} required />
      </label>
      <label>
        Información del proceso de elaboración
        <textarea value={informacionProceso} onChange={(e) => setInformacionProceso(e.target.value)} required />
      </label>
      <label>
        Fecha de elaboración (opcional)
        <input type="date" value={fechaElaboracion} onChange={(e) => setFechaElaboracion(e.target.value)} />
      </label>
      <label>
        Forma de contacto
        <input type="text" value={contactoVendedor} onChange={(e) => setContactoVendedor(e.target.value)} placeholder="Ej. WhatsApp +51 999 999 999" required />
      </label>

      {requiereRevisionReforzada && (
        <p className="advertencia-no-verificado">
          ⚠ El texto ingresado (nombre, descripción, proceso o ingredientes) contiene afirmaciones que la plataforma detecta como potencialmente engañosas o peligrosas (RF-274, ej. "cura", "elimina", "sustituye tratamiento médico"). Esto NO bloquea la publicación, pero el producto quedará marcado para una <strong>revisión reforzada</strong> por el equipo antes de poder aprobarse. Revisa el texto si esto no era tu intención.
        </p>
      )}
      <p className="comentario-meta">Tu producto quedará "Pendiente" hasta que el equipo lo revise; no aparecerá en el directorio público hasta entonces.</p>

      {error && <p className="error-formulario">{error}</p>}
      <button type="submit" disabled={enviando || subiendoFoto}>{enviando ? 'Publicando…' : 'Publicar producto'}</button>
    </form>
  );
}

export default PublicarProductoForm;
