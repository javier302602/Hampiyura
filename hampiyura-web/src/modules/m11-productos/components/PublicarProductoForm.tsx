import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { CheckCircle2, Plus, Sprout, X } from 'lucide-react';
import { listarPlantas, type Planta } from '../../m02-catalogo-plantas/api/plantas.api';
import { publicarProducto, verificarAfirmaciones, subirMedia, leerArchivoComoBase64, type Producto, type PlantaUtilizada } from '../api/productos.api';
import { obtenerPerfil } from '../../m01-cuentas/api/cuentas.api';
import { direccionInversa } from '../../m03-cultivo/api/geocoding.api';
import SelectorUbicacionMapa from '../../m03-cultivo/components/SelectorUbicacionMapa';
import { parsearEntradaPlanta, PARTES_PLANTA, ESTADOS_PARTE, UNIDADES_CANTIDAD } from './plantaUtilizadaParser';
import Button from '../../../shared/ui/Button';

// Frente 3: reestructurado en secciones (antes era un único bloque largo de campos apilados).
// Cambios funcionales respecto a la versión anterior:
// - "Plantas utilizadas" pasa de checkboxes de una lista fija a entrada libre estructurada
//   (planta + parte + estado + cantidad, ver plantaUtilizadaParser.ts), varias filas editables.
// - "Localidad" pasa de texto libre a selector de mapa (reusa SelectorUbicacionMapa de M-03) +
//   dirección autocompletada por geocodificación inversa, editable si hace falta ajustarla.
// - Se agrega el bloque de aceptación de la comisión (5%), una sola vez por cuenta (ver perfil).
function PublicarProductoForm({ onPublicado }: { onPublicado: (creado: Producto) => void }) {
  const [plantasCatalogo, setPlantasCatalogo] = useState<Planta[]>([]);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [ingredientes, setIngredientes] = useState('');
  const [presentacion, setPresentacion] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [precioReferencial, setPrecioReferencial] = useState('');
  const [fotografias, setFotografias] = useState<string[]>([]);
  const [subiendoFoto, setSubiendoFoto] = useState(false);

  const [plantasUtilizadas, setPlantasUtilizadas] = useState<PlantaUtilizada[]>([]);
  const [entradaTexto, setEntradaTexto] = useState('');

  const [localidad, setLocalidad] = useState('');
  const [coordenadas, setCoordenadas] = useState<{ lat: number; lon: number } | null>(null);
  const [resolviendoDireccion, setResolviendoDireccion] = useState(false);
  const [informacionProceso, setInformacionProceso] = useState('');
  const [fechaElaboracion, setFechaElaboracion] = useState('');
  const [contactoVendedor, setContactoVendedor] = useState('');

  const [yaAceptoComision, setYaAceptoComision] = useState<boolean | null>(null);
  const [aceptaComisionAhora, setAceptaComisionAhora] = useState(false);

  const [requiereRevisionReforzada, setRequiereRevisionReforzada] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { listarPlantas().then(setPlantasCatalogo).catch(() => {}); }, []);
  useEffect(() => { obtenerPerfil().then((p) => setYaAceptoComision(!!p.aceptoComisionEn)).catch(() => setYaAceptoComision(false)); }, []);

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

  function agregarPlanta() {
    if (!entradaTexto.trim()) return;
    const parseado = parsearEntradaPlanta(entradaTexto, plantasCatalogo);
    setPlantasUtilizadas((prev) => [...prev, { ...parseado, cantidad: '' }]);
    setEntradaTexto('');
  }
  function actualizarEntrada(indice: number, cambios: Partial<PlantaUtilizada>) {
    setPlantasUtilizadas((prev) => prev.map((p, i) => (i === indice ? { ...p, ...cambios } : p)));
  }
  function quitarEntrada(indice: number) {
    setPlantasUtilizadas((prev) => prev.filter((_, i) => i !== indice));
  }

  // Se dispara al soltar/arrastrar el pin (SelectorUbicacionMapa) -- autocompleta "Localidad" con
  // la dirección real del punto exacto, no del texto de búsqueda (que solo centra el mapa y puede
  // no coincidir si después se ajustó el pin a mano).
  function manejarCambioUbicacion(lat: number, lon: number) {
    // Frente 6: antes lat/lon solo se usaban para geocodificar y se descartaban -- ahora también
    // se guardan en estado para enviarse junto con el resto del formulario (mini-mapa en la ficha).
    setCoordenadas({ lat, lon });
    setResolviendoDireccion(true);
    direccionInversa(lat, lon)
      .then((direccion) => { if (direccion) setLocalidad(direccion); })
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
    if (plantasUtilizadas.length === 0) { setError('Agrega al menos una planta utilizada.'); return; }
    if (!yaAceptoComision && !aceptaComisionAhora) { setError('Debes aceptar los términos de comisión para publicar.'); return; }
    if (requiereRevisionReforzada) {
      const continuar = window.confirm('El texto ingresado contiene afirmaciones que activarán una revisión reforzada por parte del equipo (RF-274) antes de aprobarse. ¿Deseas publicar de todas formas?');
      if (!continuar) return;
    }
    setEnviando(true);
    setError(null);
    try {
      const creado = await publicarProducto({
        nombre, descripcion: descripcion.trim() || undefined, plantasUtilizadas, ingredientes: ingredientes.trim() || undefined,
        presentacion: presentacion.trim() || undefined, cantidad: cantidad.trim() || undefined,
        precioReferencial: precioReferencial.trim() || undefined, fotografias, localidad,
        latitud: coordenadas?.lat, longitud: coordenadas?.lon, informacionProceso,
        fechaElaboracion: fechaElaboracion || undefined, contactoVendedor,
        aceptaComision: aceptaComisionAhora || undefined,
      });
      onPublicado(creado);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo publicar el producto. Revisa los campos obligatorios.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={manejarSubmit} className="formulario" style={{ maxWidth: 720 }}>
      <div className="form-section">
        <h3 className="form-section-title">Datos del producto</h3>
        <label>
          Nombre del producto
          <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        </label>
        <label>
          Descripción
          <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        </label>
        <label>
          Ingredientes
          <textarea value={ingredientes} onChange={(e) => setIngredientes(e.target.value)} />
        </label>
        <label>
          Presentación
          <input type="text" value={presentacion} onChange={(e) => setPresentacion(e.target.value)} placeholder="Ej. frasco de vidrio 250ml" />
        </label>
        <label>
          Cantidad disponible
          <input type="text" value={cantidad} onChange={(e) => setCantidad(e.target.value)} placeholder="Ej. 20 unidades" />
        </label>
        <label>
          Precio referencial (opcional)
          <input type="text" value={precioReferencial} onChange={(e) => setPrecioReferencial(e.target.value)} />
        </label>
      </div>

      <div className="form-section">
        <h3 className="form-section-title">Plantas utilizadas</h3>
        <p className="form-section-desc">
          Escribe la planta y su forma (ej. "hoja seca de uña de gato", "fruto en pasta") y presiona "Agregar" -- el sistema separa
          planta / parte usada / estado automáticamente; revisa y corrige los campos si hace falta antes de publicar.
        </p>
        <div className="plant-entry-add">
          <input
            type="text"
            value={entradaTexto}
            placeholder='Ej. "hoja seca de uña de gato"'
            onChange={(e) => setEntradaTexto(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); agregarPlanta(); } }}
          />
          <Button type="button" variant="secondary" iconLeft={<Plus size={16} aria-hidden="true" />} onClick={agregarPlanta}>
            Agregar
          </Button>
        </div>

        {plantasUtilizadas.length > 0 && (
          <div className="plant-entry-list">
            {plantasUtilizadas.map((p, i) => (
              <div key={i} className="plant-entry-row">
                <div>
                  <input
                    type="text"
                    value={p.plantaNombreLibre}
                    onChange={(e) => actualizarEntrada(i, { plantaNombreLibre: e.target.value, plantaId: undefined })}
                    list="catalogo-plantas-datalist"
                    aria-label="Nombre de la planta"
                  />
                  <span className={`plant-entry-row-match ${p.plantaId ? 'plant-entry-row-match-ok' : 'plant-entry-row-match-libre'}`}>
                    {p.plantaId ? <><CheckCircle2 size={13} aria-hidden="true" /> En el catálogo</> : <><Sprout size={13} aria-hidden="true" /> Nombre libre (sin match)</>}
                  </span>
                </div>
                <select value={p.parteUsada} aria-label="Parte usada" onChange={(e) => actualizarEntrada(i, { parteUsada: e.target.value })}>
                  {PARTES_PLANTA.map((parte) => <option key={parte} value={parte}>{parte}</option>)}
                </select>
                <select value={p.estado} aria-label="Estado" onChange={(e) => actualizarEntrada(i, { estado: e.target.value })}>
                  {ESTADOS_PARTE.map((estado) => <option key={estado} value={estado}>{estado}</option>)}
                </select>
                <div className="plant-entry-cantidad">
                  <input type="text" inputMode="decimal" value={p.cantidad?.split(' ')[0] ?? ''} aria-label="Cantidad" placeholder="Cant." onChange={(e) => actualizarEntrada(i, { cantidad: `${e.target.value} ${p.cantidad?.split(' ')[1] ?? UNIDADES_CANTIDAD[0]}`.trim() })} />
                  <select aria-label="Unidad" value={p.cantidad?.split(' ')[1] ?? UNIDADES_CANTIDAD[0]} onChange={(e) => actualizarEntrada(i, { cantidad: `${p.cantidad?.split(' ')[0] ?? ''} ${e.target.value}`.trim() })}>
                    {UNIDADES_CANTIDAD.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <button type="button" className="icon-btn" aria-label="Quitar planta" onClick={() => quitarEntrada(i)}><X size={15} aria-hidden="true" /></button>
              </div>
            ))}
          </div>
        )}
        <datalist id="catalogo-plantas-datalist">
          {plantasCatalogo.map((p) => <option key={p.id} value={p.nombreComun} />)}
        </datalist>
      </div>

      <div className="form-section">
        <h3 className="form-section-title">Ubicación y contacto</h3>
        <label>
          Localidad
          <input type="text" value={localidad} onChange={(e) => setLocalidad(e.target.value)} placeholder="Marca el punto en el mapa para autocompletar" required />
        </label>
        {resolviendoDireccion && <p className="comentario-meta">Resolviendo dirección…</p>}
        <SelectorUbicacionMapa onCambiarUbicacion={manejarCambioUbicacion} />

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
      </div>

      <div className="form-section">
        <h3 className="form-section-title">Fotos</h3>
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
      </div>

      <div className="form-section">
        {yaAceptoComision ? (
          <p className="consent-box-ya-aceptado"><CheckCircle2 size={16} aria-hidden="true" /> Ya aceptaste los términos de comisión en una publicación anterior.</p>
        ) : (
          <div className="consent-box">
            <input type="checkbox" id="acepta-comision" checked={aceptaComisionAhora} onChange={(e) => setAceptaComisionAhora(e.target.checked)} />
            <label htmlFor="acepta-comision">
              Acepto que HampiYura retiene una <strong>comisión mínima del 5%</strong> sobre las ganancias generadas por la venta de
              este producto a través de la plataforma. Esta aceptación queda registrada en tu perfil y aplica a todas tus
              publicaciones futuras -- no se te volverá a preguntar.
            </label>
          </div>
        )}

        {requiereRevisionReforzada && (
          <p className="advertencia-no-verificado">
            ⚠ El texto ingresado (nombre, descripción, proceso o ingredientes) contiene afirmaciones que la plataforma detecta como potencialmente engañosas o peligrosas (RF-274, ej. "cura", "elimina", "sustituye tratamiento médico"). Esto NO bloquea la publicación, pero el producto quedará marcado para una <strong>revisión reforzada</strong> por el equipo antes de poder aprobarse. Revisa el texto si esto no era tu intención.
          </p>
        )}
        <p className="comentario-meta">Tu producto quedará "Pendiente" hasta que el equipo lo revise; no aparecerá en el directorio público hasta entonces.</p>

        {error && <p className="error-formulario">{error}</p>}
        <Button type="submit" variant="primary" loading={enviando} disabled={subiendoFoto}>
          {enviando ? 'Publicando…' : 'Publicar producto'}
        </Button>
      </div>
    </form>
  );
}

export default PublicarProductoForm;
