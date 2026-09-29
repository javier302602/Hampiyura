import { FormEvent, useEffect, useState } from 'react';
import { obtenerMiCobro, configurarCobro, type CobroProducto } from '../../m16-pedidos/api/pedidos.api';
import Button from '../../../shared/ui/Button';

// M-16 · El vendedor registra a dónde le paga el comprador (Yape/Plin/cuenta) y en cuántos días se compromete a
// entregar. Solo lo ve el dueño del producto: estos números NUNCA salen en la ficha pública, solo dentro de un pedido.
function PanelCobroVendedor({ productoId }: { productoId: string }) {
  const [cobro, setCobro] = useState<CobroProducto | null | undefined>(undefined); // undefined = cargando
  const [yape, setYape] = useState(''); const [plin, setPlin] = useState(''); const [cuenta, setCuenta] = useState(''); const [entregaDias, setEntregaDias] = useState('5');
  const [acepta, setAcepta] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);

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
    </section>
  );
}

export default PanelCobroVendedor;
