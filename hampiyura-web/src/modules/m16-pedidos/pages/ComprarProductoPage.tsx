import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { obtenerEstadoCompra, vistaPreviaPedido, crearPedido, type EstadoCompra, type VistaPreviaPedido } from '../api/pedidos.api';
import { obtenerProducto } from '../../m11-productos/api/productos.api';
import SelectorUbicacionMapa from '../../m03-cultivo/components/SelectorUbicacionMapa';
import Button from '../../../shared/ui/Button';
import SectionHeader from '../../../shared/ui/SectionHeader';
import LoadingState from '../../../shared/ui/LoadingState';
import ErrorState from '../../../shared/ui/ErrorState';
import RequireRole from '../../../shared/auth/RequireRole';

// M-16 · Compra directa (paso 1/2): datos de entrega + ubicación GPS + cantidad -> vista previa del contrato (con el
// envío calculado por distancia real) -> aceptar y crear el pedido. Después de creado, el comprador paga por su
// cuenta (Yape/Plin/cuenta del vendedor) y sube el comprobante desde el detalle del pedido.
function ComprarProductoPage() {
  const navigate = useNavigate();
  const { productoId = '' } = useParams();
  const [nombreProducto, setNombreProducto] = useState('');
  const [estado, setEstado] = useState<EstadoCompra | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [nombre, setNombre] = useState(''); const [telefono, setTelefono] = useState(''); const [direccion, setDireccion] = useState('');
  const [ubicacion, setUbicacion] = useState<{ lat: number; lon: number } | null>(null);
  const [referencia, setReferencia] = useState('');
  const [previa, setPrevia] = useState<VistaPreviaPedido | null>(null);
  const [acepta, setAcepta] = useState(false);
  const [cargandoPrevia, setCargandoPrevia] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([obtenerEstadoCompra(productoId), obtenerProducto(productoId)]).then(([e, p]) => { setEstado(e); setNombreProducto(p.nombre); }).catch(() => setError('No se pudo cargar el producto.'));
  }, [productoId]);

  async function verContrato(e: FormEvent) {
    e.preventDefault(); setError(null);
    if (!ubicacion) { setError('Marca tu ubicación en el mapa: sin eso no se puede calcular el envío.'); return; }
    setCargandoPrevia(true); setPrevia(null); setAcepta(false);
    try { setPrevia(await vistaPreviaPedido(productoId, cantidad, { nombre, telefono, direccion, latitud: ubicacion.lat, longitud: ubicacion.lon })); }
    catch (err) { setError(err instanceof Error ? err.message : 'No se pudo calcular el pedido.'); }
    finally { setCargandoPrevia(false); }
  }
  async function confirmarPedido() {
    if (!ubicacion) return;
    setEnviando(true); setError(null);
    try {
      const { id } = await crearPedido({ productoId, cantidad, entrega: { nombre, telefono, direccion, latitud: ubicacion.lat, longitud: ubicacion.lon, referencia: referencia.trim() || undefined }, aceptaContrato: true });
      navigate(`/m16-pedidos/${id}`);
    }
    catch (err) { setError(err instanceof Error ? err.message : 'No se pudo crear el pedido.'); }
    finally { setEnviando(false); }
  }

  if (error && !estado) return <ErrorState description={error} />;
  if (!estado) return <LoadingState label="Cargando" />;
  if (!estado.comprable) return (
    <section>
      <SectionHeader title="No se puede comprar este producto" description={estado.motivo} />
      <Button variant="secondary" onClick={() => navigate(-1)}>Volver</Button>
    </section>
  );

  return (
    <section>
      <Button variant="ghost" onClick={() => navigate(-1)}>← Volver al producto</Button>
      <SectionHeader eyebrow="Compra directa" title={`Comprar: ${nombreProducto}`} description="Pagas directo al vendedor. HampiYura no recibe ni retiene el dinero: registra el contrato y media si hay un reclamo." />
      <RequireRole permitido={() => true}>
        {!previa ? (
          <form onSubmit={verContrato} className="formulario" style={{ maxWidth: 560 }}>
            <label>Cantidad{estado.stockDisponible != null && ` (quedan ${estado.stockDisponible})`}
              <input type="number" min={1} max={estado.stockDisponible != null ? estado.stockDisponible : 20} value={cantidad} onChange={(e) => setCantidad(Number(e.target.value))} required />
            </label>
            <label>Nombre de quien recibe
              <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
            </label>
            <label>Teléfono de contacto para la entrega
              <input type="text" value={telefono} onChange={(e) => setTelefono(e.target.value)} required />
            </label>
            <label>Dirección de entrega completa (calle, número, distrito, ciudad)
              <textarea value={direccion} onChange={(e) => setDireccion(e.target.value)} rows={2} required />
            </label>
            <div>
              <p style={{ marginBottom: '.3rem' }}>Ubicación de entrega en el mapa</p>
              <p className="comentario-meta" style={{ marginTop: 0 }}>Necesaria para calcular el costo de envío por la distancia real hasta el vendedor.</p>
              <SelectorUbicacionMapa permitirGps onCambiarUbicacion={(lat, lon) => setUbicacion({ lat, lon })} />
            </div>
            {error && <p className="error-formulario">{error}</p>}
            <Button type="submit" variant="primary" loading={cargandoPrevia}>Ver el contrato y el total</Button>
          </form>
        ) : (
          <div style={{ maxWidth: 680 }}>
            <dl className="detalle-campos" style={{ maxWidth: 360 }}>
              <div><dt>Subtotal</dt><dd>S/ {previa.subtotal.toFixed(2)} <span className="comentario-meta">({previa.cantidad} × S/ {previa.precioUnitario.toFixed(2)})</span></dd></div>
              <div><dt>Envío</dt><dd>{previa.distanciaKm != null ? `S/ ${previa.costoEnvio.toFixed(2)} (${previa.distanciaKm.toFixed(1)} km)` : 'No se pudo calcular por distancia: el vendedor no marcó su ubicación exacta al publicar. Coordina el envío con él.'}</dd></div>
            </dl>
            <p className="panel-comprar-precio">Total a pagar: S/ {previa.total.toFixed(2)}</p>
            {previa.envioLargo && (
              <label style={{ display: 'grid', gap: '.35rem', fontWeight: 700, margin: '1rem 0' }}>
                Punto de referencia cercano y conocido para la entrega (ej. "paradero de la plaza de armas")
                <input type="text" value={referencia} onChange={(ev) => setReferencia(ev.target.value)} required minLength={3} style={{ font: 'inherit', padding: '.55em .7em', borderRadius: 8, border: '1px solid #ccc', background: 'var(--color-surface)', color: 'var(--color-text)', fontWeight: 400 }} />
                <span className="comentario-meta" style={{ fontWeight: 400 }}>La entrega queda lejos del vendedor: no hay un paradero real que podamos ubicar automáticamente en esta zona, así que se coordina con este punto.</span>
              </label>
            )}
            <h3>Contrato de compraventa</h3>
            <pre className="contrato-texto">{previa.contrato}</pre>
            <label className="mostrar-clave">
              <input type="checkbox" checked={acepta} onChange={(e) => setAcepta(e.target.checked)} />
              Leí y acepto este contrato de compraventa.
            </label>
            {error && <p className="error-formulario">{error}</p>}
            <div style={{ display: 'flex', gap: '.6rem', marginTop: '.8rem' }}>
              <Button variant="secondary" onClick={() => setPrevia(null)}>Corregir datos</Button>
              <Button variant="primary" loading={enviando} disabled={!acepta || (previa.envioLargo && referencia.trim().length < 3)} onClick={confirmarPedido}>Confirmar pedido</Button>
            </div>
          </div>
        )}
      </RequireRole>
    </section>
  );
}

export default ComprarProductoPage;
