import { FormEvent, useEffect, useState } from 'react';
import { obtenerMiCobro, configurarCobro, fijarStock, type CobroProducto } from '../../m16-pedidos/api/pedidos.api';
import Button from '../../../shared/ui/Button';

// M-16 · El vendedor registra a dónde le paga el comprador (Yape/Plin/cuenta) y en cuántos días se compromete a
// entregar. Solo lo ve el dueño del producto: estos números NUNCA salen en la ficha pública, solo dentro de un pedido.
function PanelCobroVendedor({ productoId, stockActual, onCambioStock }: { productoId: string; stockActual?: number | null; onCambioStock: () => void }) {
  const [cobro, setCobro] = useState<CobroProducto | null | undefined>(undefined); // undefined = cargando
  const [yape, setYape] = useState(''); const [plin, setPlin] = useState(''); const [cuenta, setCuenta] = useState(''); const [entregaDias, setEntregaDias] = useState('5');
  const [acepta, setAcepta] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);

  const [gestionaStock, setGestionaStock] = useState(stockActual != null);
  const [stock, setStock] = useState(stockActual != null ? String(stockActual) : '0');
  const [guardandoStock, setGuardandoStock] = useState(false);
  const [errorStock, setErrorStock] = useState<string | null>(null);
  async function guardarStock(e: FormEvent) {
    e.preventDefault(); setGuardandoStock(true); setErrorStock(null);
    try { await fijarStock(productoId, gestionaStock ? Number(stock) : null); onCambioStock(); }
    catch (err) { setErrorStock(err instanceof Error ? err.message : 'No se pudo guardar.'); }
    finally { setGuardandoStock(false); }
  }

  useEffect(() => {
    obtenerMiCobro(productoId).then((c) => { setCobro(c); if (c) { setYape(c.yape ?? ''); setPlin(c.plin ?? ''); setCuenta(c.cuenta ?? ''); setEntregaDias(String(c.entregaDias)); setAcepta(true); } }).catch(() => setCobro(null));
  }, [productoId]);

  async function guardar(e: FormEvent) {
    e.preventDefault(); setGuardando(true); setError(null); setGuardado(false);
    try {
      await configurarCobro(productoId, { yape: yape.trim() || undefined, plin: plin.trim() || undefined, cuenta: cuenta.trim() || undefined, entregaDias: Number(entregaDias), aceptaCompromiso: acepta });
      setCobro({ yape: yape.trim() || undefined, plin: plin.trim() || undefined, cuenta: cuenta.trim() || undefined, entregaDias: Number(entregaDias) });
      setGuardado(true);
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo guardar.'); }
    finally { setGuardando(false); }
  }

  if (cobro === undefined) return null;

  return (
    <section style={{ marginTop: '1.5rem' }}>
      <h3>Cómo te paga quien compre este producto</h3>
      <p className="comentario-meta">
        Estos datos solo los ve el comprador dentro de su pedido, nunca en la ficha pública. HampiYura no recibe ni retiene este dinero: paga directo a ti.
      </p>
      {!cobro && <p className="advertencia-no-verificado">⚠ Todavía no configuraste cómo cobras: nadie puede comprar este producto hasta que lo hagas.</p>}
      {cobro && guardado && <p className="sello-verificado">✔ Guardado.</p>}
      {error && <p className="error-formulario">{error}</p>}
      <form onSubmit={guardar} className="formulario" style={{ maxWidth: 480 }}>
        <label>Yape (celular)
          <input type="text" value={yape} onChange={(e) => setYape(e.target.value)} placeholder="9XXXXXXXX" />
        </label>
        <label>Plin (celular)
          <input type="text" value={plin} onChange={(e) => setPlin(e.target.value)} placeholder="9XXXXXXXX" />
        </label>
        <label>Cuenta bancaria (banco y número, o CCI)
          <input type="text" value={cuenta} onChange={(e) => setCuenta(e.target.value)} placeholder="Ej. BCP 191-1234567-0-12" />
        </label>
        <label>Días para entregar, contados desde que confirmes el pago
          <input type="number" min={1} max={30} value={entregaDias} onChange={(e) => setEntregaDias(e.target.value)} />
        </label>
        <label className="mostrar-clave">
          <input type="checkbox" checked={acepta} onChange={(e) => setAcepta(e.target.checked)} />
          Me comprometo a entregar en ese plazo o devolver el pago íntegro si no cumplo (ver el contrato que acepta el comprador).
        </label>
        <Button type="submit" variant="primary" loading={guardando} disabled={!acepta}>{cobro ? 'Actualizar' : 'Guardar y habilitar la compra'}</Button>
      </form>

      <h3 style={{ marginTop: '1.5rem' }}>Stock disponible</h3>
      <p className="comentario-meta">
        Si lo gestionas, el número es público (lo ve cualquiera en la ficha) y baja solo cuando confirmas el pago de un pedido; nunca al solo pedir o con un comprobante sin confirmar.
      </p>
      {errorStock && <p className="error-formulario">{errorStock}</p>}
      <form onSubmit={guardarStock} className="formulario" style={{ maxWidth: 320 }}>
        <label className="mostrar-clave">
          <input type="checkbox" checked={gestionaStock} onChange={(e) => setGestionaStock(e.target.checked)} />
          Gestionar el stock de este producto
        </label>
        {gestionaStock && (
          <label>Unidades disponibles
            <input type="number" min={0} value={stock} onChange={(e) => setStock(e.target.value)} required />
          </label>
        )}
        <Button type="submit" variant="secondary" loading={guardandoStock}>Guardar stock</Button>
      </form>
    </section>
  );
}

export default PanelCobroVendedor;
