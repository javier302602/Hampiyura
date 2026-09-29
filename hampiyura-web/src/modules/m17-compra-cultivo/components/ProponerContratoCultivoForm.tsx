import { FormEvent, useState } from 'react';
import { proponerContratoCultivo } from '../api/contratos-cultivo.api';
import Button from '../../../shared/ui/Button';

// M-17 · Formulario mínimo para proponerle al agricultor una compra directa de su cosecha: cantidad (texto libre,
// un cultivo no tiene una unidad de venta fija) y el monto TOTAL que se ofrece. El agricultor la acepta tal cual
// o la rechaza -- no hay contraoferta en esta primera versión.
interface Props { cultivoId: string; onPropuesta: (id: string) => void; onCancelar: () => void }
function ProponerContratoCultivoForm({ cultivoId, onPropuesta, onCancelar }: Props) {
  const [cantidad, setCantidad] = useState('');
  const [monto, setMonto] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar(e: FormEvent) {
    e.preventDefault(); setError(null); setEnviando(true);
    try {
      const montoAcordado = Number(monto);
      const { id } = await proponerContratoCultivo({ cultivoId, cantidad, montoAcordado, mensaje: mensaje.trim() || undefined });
      onPropuesta(id);
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo enviar la propuesta.'); }
    finally { setEnviando(false); }
  }

  return (
    <form onSubmit={enviar} className="formulario" style={{ maxWidth: 420, marginTop: '.8rem' }}>
      <p className="comentario-meta" style={{ marginTop: 0 }}>
        Le propones al agricultor comprar directamente parte de esta cosecha. Si acepta, pagas un adelanto del 50% y subes el comprobante; el saldo se coordina y se paga directo con él al recibir.
      </p>
      <label>Cantidad que quieres pedir (ej. "50 kg", "200 plantones")
        <input type="text" value={cantidad} onChange={(e) => setCantidad(e.target.value)} required minLength={2} />
      </label>
      <label>Monto total que ofreces (S/)
        <input type="number" min={1} step="0.5" value={monto} onChange={(e) => setMonto(e.target.value)} required />
      </label>
      <label>Mensaje para el agricultor (opcional)
        <textarea value={mensaje} onChange={(e) => setMensaje(e.target.value)} rows={2} maxLength={500} />
      </label>
      {error && <p className="error-formulario">{error}</p>}
      <div style={{ display: 'flex', gap: '.6rem' }}>
        <Button type="button" variant="ghost" onClick={onCancelar}>Cancelar</Button>
        <Button type="submit" variant="primary" loading={enviando}>Enviar propuesta</Button>
      </div>
    </form>
  );
}

export default ProponerContratoCultivoForm;
