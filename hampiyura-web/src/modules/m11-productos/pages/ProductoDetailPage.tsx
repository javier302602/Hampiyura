import { FormEvent, useEffect, useState } from 'react';
import { obtenerProducto, marcarValidadoDocumentalmente, marcarCertificado, ETIQUETAS_TIPO_PRODUCTOR, type ProductoVisible } from '../api/productos.api';
import Button from '../../../shared/ui/Button';
import IndicadoresProducto from '../components/IndicadoresProducto';
import { esValidador, getSession } from '../../../shared/auth/session';
import MiniMapaUbicacion from '../../m03-cultivo/components/MiniMapaUbicacion';

function PanelCertificacion({ producto, onActualizado }: { producto: ProductoVisible; onActualizado: () => void }) {
  const [documentacion, setDocumentacion] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function manejarValidarDocumental() {
    setEnviando(true);
    setError(null);
    try { await marcarValidadoDocumentalmente(producto.id); onActualizado(); }
    catch (err) { setError(err instanceof Error ? err.message : 'No se pudo marcar como validado documentalmente.'); }
    finally { setEnviando(false); }
  }

  async function manejarCertificar(e: FormEvent) {
    e.preventDefault();
    if (!documentacion.trim()) { setError('Debes adjuntar/describir la certificación real para poder certificar.'); return; }
    setEnviando(true);
    setError(null);
    try { await marcarCertificado(producto.id, documentacion.trim()); setDocumentacion(''); onActualizado(); }
    catch (err) { setError(err instanceof Error ? err.message : 'No se pudo certificar el producto.'); }
    finally { setEnviando(false); }
  }

  return (
    <section style={{ marginTop: '1.5rem' }}>
      <h3>Panel de certificación / validación documental</h3>
      {producto.requiereRevisionReforzada && (
        <p className="advertencia-no-verificado">⚠ Este producto fue marcado en su momento para revisión reforzada: el texto original activó la detección de afirmaciones potencialmente engañosas.</p>
      )}
      {error && <p className="error-formulario">{error}</p>}

      {producto.etiquetaValidadoDocumental ? (
        <p className="comentario-meta">Ya está marcado como validado documentalmente.</p>
      ) : (
        <Button variant="secondary" size="sm" onClick={manejarValidarDocumental} disabled={enviando}>Validar documentalmente</Button>
      )}

      {producto.etiquetaCertificado ? (
        <p className="comentario-meta">Ya está certificado ({producto.documentacionCertificacion}).</p>
      ) : (
        <form onSubmit={manejarCertificar} className="formulario" style={{ marginTop: '1rem' }}>
          {!producto.etiquetaValidadoDocumental && (
            <p className="nota-cientifico">Recomendado (no obligatorio): valida documentalmente antes de certificar. El backend permite certificar sin ese paso porque ambas etiquetas son independientes (RF-272).</p>
          )}
          <label>
            Documentación / certificación adjunta
            <input type="text" value={documentacion} onChange={(e) => setDocumentacion(e.target.value)} placeholder="Ej. Certificado sanitario N° 1234 emitido por..." />
          </label>
          <button type="submit" disabled={enviando || !documentacion.trim()}>Certificar</button>
        </form>
      )}
    </section>
  );
}

function ProductoDetailPage({ productoId, onVolver, onContactar }: { productoId: string; onVolver: () => void; onContactar?: (productorId: string) => void }) {
  const [producto, setProducto] = useState<ProductoVisible | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function cargar() {
    setCargando(true);
    setError(null);
    obtenerProducto(productoId).then(setProducto).catch(() => setError('No se pudo cargar el producto (puede que ya no esté disponible).')).finally(() => setCargando(false));
  }

  useEffect(cargar, [productoId]);

  if (cargando) return <p>Cargando producto…</p>;
  if (error) return <p>{error}</p>;
  if (!producto) return <p>No se encontró el producto.</p>;

  return (
    <section>
      <Button variant="ghost" size="sm" onClick={onVolver}>← Volver al directorio</Button>
      <h2>{producto.nombre}</h2>
      <p>Por {producto.productorNombre} · Zona: {producto.localidad}</p>
      <p><strong>Tipo de productor:</strong> {producto.tipoProductor ? ETIQUETAS_TIPO_PRODUCTOR[producto.tipoProductor] : 'No especificado'}</p>

      <IndicadoresProducto revisadoPorEquipo={producto.revisadoPorEquipo} validadoDocumental={producto.etiquetaValidadoDocumental} certificado={producto.etiquetaCertificado} />

      {/* Frente 6: el selector de mapa al publicar (Frente 3) ya capturaba el pin, pero antes solo
          se usaba para geocodificación inversa y se descartaba -- productos publicados desde este
          cambio guardan latitud/longitud reales; los anteriores no las tienen, y acá no se inventa
          un punto genérico para rellenar el hueco. */}
      {producto.latitud != null && producto.longitud != null ? (
        <div style={{ marginTop: '1rem' }}>
          <h3>Ubicación</h3>
          <MiniMapaUbicacion latitud={producto.latitud} longitud={producto.longitud} etiqueta={producto.localidad} />
        </div>
      ) : producto.contactoBloqueado ? (
        <p className="comentario-meta" style={{ marginTop: '1rem' }}>
          El punto exacto donde se fabrica solo lo ven quienes tienen un plan activo o desbloquean a este productor.
        </p>
      ) : (
        <p className="comentario-meta" style={{ marginTop: '1rem' }}>
          Este producto no tiene un punto exacto guardado en el mapa (quien lo publica no marcó el punto en el mapa).
        </p>
      )}

      {producto.fotografias.length > 0 && (
        <div className="galeria-imagenes">
          {producto.fotografias.map((url) => <img key={url} src={url} alt={producto.nombre} />)}
        </div>
      )}

      {producto.descripcion && (<><h3>Descripción</h3><p>{producto.descripcion}</p></>)}
      <h3>Para qué sirve y cómo se usa</h3>
      <p><strong>Categoría de uso:</strong> {producto.categoriasUso && producto.categoriasUso.length > 0 ? producto.categoriasUso.join(', ') : 'No especificada por el productor'}</p>
      <p><strong>Modo de uso:</strong> {producto.modoDeUso ?? 'No especificado por el productor'}</p>
      <p><strong>Prevenciones y contraindicaciones:</strong> {producto.contraindicaciones ?? 'No especificadas por el productor'}</p>
      <p className="comentario-meta">Información aportada por quien produce; no sustituye la consulta con un profesional de la salud.</p>
      <h3>Plantas utilizadas</h3>
      {/* plantasUtilizadas (Frente 3) es la entrada estructurada nueva -- productos publicados
          antes de este cambio no la tienen, así que se conserva el fallback a plantasNombres
          (derivado de plantasIds) para no perder esa información. */}
      {producto.plantasUtilizadas && producto.plantasUtilizadas.length > 0 ? (
        <ul style={{ margin: '.4em 0', paddingLeft: '1.2em' }}>
          {producto.plantasUtilizadas.map((pu, i) => (
            <li key={i}>
              <strong>{pu.plantaNombreLibre}</strong> — {pu.parteUsada}, {pu.estado}{pu.cantidad ? ` (${pu.cantidad})` : ''}
            </li>
          ))}
        </ul>
      ) : (
        <p>{producto.plantasNombres.join(', ')}</p>
      )}
      {producto.ingredientes && (<><h3>Ingredientes</h3><p>{producto.ingredientes}</p></>)}
      {producto.presentacion && <span>Presentación: {producto.presentacion}</span>}
      {producto.cantidad && <span>Cantidad: {producto.cantidad}</span>}
      {producto.precioReferencial && <span>Precio referencial: {producto.precioReferencial}</span>}
      <h3>Información del proceso</h3>
      <p>{producto.informacionProceso}</p>
      {producto.fechaElaboracion && <span>Fecha de elaboración: {new Date(producto.fechaElaboracion).toLocaleDateString()}</span>}

      {producto.revisadoPorEquipo && producto.contactoVendedor && (
        <p className="sello-verificado">✔ Contacto del vendedor: {producto.contactoVendedor}</p>
      )}
      {producto.contactoBloqueado && (
        <div className="contacto-bloqueado" role="region" aria-label="Contacto bloqueado">
          <h3>El contacto y la ubicación exacta están bloqueados</h3>
          <p>Necesitas un plan activo o desbloquear a este productor para ver cómo contactarlo y dónde se fabrica. La ficha del producto sigue siendo gratis.</p>
          <button type="button" className="btn btn-primary" onClick={() => onContactar?.(producto.productorId)}>Contactar</button>
        </div>
      )}

      {/* Solo el equipo ve este panel; el resto no debe ver un aviso de "Sin permisos" en una ficha pública. */}
      {(() => { const sesion = getSession(); return sesion && esValidador(sesion.rol) ? <PanelCertificacion producto={producto} onActualizado={cargar} /> : null; })()}
    </section>
  );
}

export default ProductoDetailPage;
