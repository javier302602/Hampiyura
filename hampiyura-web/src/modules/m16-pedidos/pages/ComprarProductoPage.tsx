import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { obtenerEstadoCompra, vistaPreviaPedido, crearPedido, type EstadoCompra, type VistaPreviaPedido } from '../api/pedidos.api';
import { obtenerProducto } from '../../m11-productos/api/productos.api';
import Button from '../../../shared/ui/Button';
import SectionHeader from '../../../shared/ui/SectionHeader';
import LoadingState from '../../../shared/ui/LoadingState';
import ErrorState from '../../../shared/ui/ErrorState';
import RequireRole from '../../../shared/auth/RequireRole';

// M-16 · Compra directa (paso 1/2): datos de entrega + cantidad -> vista previa del contrato -> aceptar y crear el pedido.
// Después de creado, el comprador paga por su cuenta (Yape/Plin/cuenta del vendedor) y sube el comprobante desde el detalle del pedido.
function ComprarProductoPage() {
  const navigate = useNavigate();
  const { productoId = '' } = useParams();
  const [nombreProducto, setNombreProducto] = useState('');
  const [estado, setEstado] = useState<EstadoCompra | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [nombre, setNombre] = useState(''); const [telefono, setTelefono] = useState(''); const [direccion, setDireccion] = useState('');
  const [previa, setPrevia] = useState<VistaPreviaPedido | null>(null);
  const [acepta, setAcepta] = useState(false);
  const [cargandoPrevia, setCargandoPrevia] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([obtenerEstadoCompra(productoId), obtenerProducto(productoId)]).then(([e, p]) => { setEstado(e); setNombreProducto(p.nombre); }).catch(() => setError('No se pudo cargar el producto.'));
  }, [productoId]);

  async function verContrato(e: FormEvent) {
    e.preventDefault(); setError(null); setCargandoPrevia(true); setPrevia(null); setAcepta(false);
    try { setPrevia(await vistaPreviaPedido(productoId, cantidad, { nombre, telefono, direccion })); }
    catch (err) { setError(err instanceof Error ? err.message : 'No se pudo calcular el pedido.'); }
    finally { setCargandoPrevia(false); }
  }
  async function confirmarPedido() {
    setEnviando(true); setError(null);
    try { const { id } = await crearPedido({ productoId, cantidad, entrega: { nombre, telefono, direccion }, aceptaContrato: true }); navigate(`/m16-pedidos/${id}`); }
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
            <label>Cantidad
              <input type="number" min={1} max={20} value={cantidad} onChange={(e) => setCantidad(Number(e.target.value))} required />
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
            {error && <p className="error-formulario">{error}</p>}
            <Button type="submit" variant="primary" loading={cargandoPrevia}>Ver el contrato y el total</Button>
          </form>
        ) : (
          <div style={{ maxWidth: 680 }}>
            <p className="panel-comprar-precio">Total a pagar: S/ {previa.total.toFixed(2)} <span className="comentario-meta">({previa.cantidad} × S/ {previa.precioUnitario.toFixed(2)})</span></p>
            <h3>Contrato de compraventa</h3>
            <pre className="contrato-texto">{previa.contrato}</pre>
            <label className="mostrar-clave">
              <input type="checkbox" checked={acepta} onChange={(e) => setAcepta(e.target.checked)} />
              Leí y acepto este contrato de compraventa.
            </label>
            {error && <p className="error-formulario">{error}</p>}
            <div style={{ display: 'flex', gap: '.6rem', marginTop: '.8rem' }}>
              <Button variant="secondary" onClick={() => setPrevia(null)}>Corregir datos</Button>
              <Button variant="primary" loading={enviando} disabled={!acepta} onClick={confirmarPedido}>Confirmar pedido</Button>
            </div>
          </div>
        )}
      </RequireRole>
    </section>
  );
}

export default ComprarProductoPage;
