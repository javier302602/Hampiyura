import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { reclamosPendientes, type ReclamoResumen } from '../api/pedidos.api';
import SectionHeader from '../../../shared/ui/SectionHeader';
import LoadingState from '../../../shared/ui/LoadingState';
import EmptyState from '../../../shared/ui/EmptyState';

// M-16 · Bandeja de reclamos de pedidos (solo Administrador): lo que las partes no resolvieron entre ellas.
function ReclamosPedidosPage() {
  const navigate = useNavigate();
  const [lista, setLista] = useState<ReclamoResumen[] | null>(null);
  useEffect(() => { reclamosPendientes().then(setLista).catch(() => setLista([])); }, []);
  return (
    <section>
      <SectionHeader eyebrow="M-16 · Compra directa" title="Reclamos de pedidos" description="HampiYura no custodia el dinero de estos pedidos: revisa la evidencia registrada (contrato, comprobante y línea de tiempo) y cierra el reclamo con una resolución." />
      {!lista && <LoadingState label="Cargando reclamos" />}
      {lista && lista.length === 0 && <EmptyState title="No hay reclamos pendientes" />}
      {lista && lista.length > 0 && (
        <div className="cards">
          {lista.map((r) => (
            <article key={r.id} className="tarjeta-clicable" style={{ flex: '1 1 300px' }} tabIndex={0} role="button" onClick={() => navigate(`/m16-pedidos/${r.id}`)} onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/m16-pedidos/${r.id}`); }}>
              <strong>{r.productoNombre}</strong>
              <span>Total: S/ {r.total.toFixed(2)}</span>
              <span className="comentario-meta">{r.motivoReclamo}</span>
              <span className="comentario-meta">Abierto el {new Date(r.creadoEn).toLocaleDateString('es-PE')}</span>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default ReclamosPedidosPage;
