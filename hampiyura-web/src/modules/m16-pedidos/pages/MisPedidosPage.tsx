import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { misPedidos, ETIQUETA_ESTADO_PEDIDO, type PedidoResumen } from '../api/pedidos.api';
import RequireRole from '../../../shared/auth/RequireRole';
import Button from '../../../shared/ui/Button';
import Badge from '../../../shared/ui/Badge';
import SectionHeader from '../../../shared/ui/SectionHeader';
import LoadingState from '../../../shared/ui/LoadingState';
import EmptyState from '../../../shared/ui/EmptyState';

// M-16 · Mis pedidos: como comprador (lo que pediste) o como vendedor (lo que te compraron), con una pestaña para cada uno.
function MisPedidosPage() {
  const navigate = useNavigate();
  const [rol, setRol] = useState<'comprador' | 'vendedor'>('comprador');
  const [lista, setLista] = useState<PedidoResumen[] | null>(null);
  useEffect(() => { setLista(null); misPedidos(rol).then(setLista).catch(() => setLista([])); }, [rol]);

  return (
    <section>
      <SectionHeader eyebrow="Compra directa" title="Mis pedidos" />
      <RequireRole permitido={() => true}>
        <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1rem' }}>
          <Button variant={rol === 'comprador' ? 'primary' : 'secondary'} onClick={() => setRol('comprador')}>Lo que compré</Button>
          <Button variant={rol === 'vendedor' ? 'primary' : 'secondary'} onClick={() => setRol('vendedor')}>Lo que me compraron</Button>
        </div>
        {!lista && <LoadingState label="Cargando pedidos" />}
        {lista && lista.length === 0 && <EmptyState title={rol === 'comprador' ? 'Todavía no compraste nada' : 'Todavía no te compraron nada'} description="Los pedidos que hagas o recibas aparecerán aquí." />}
        {lista && lista.length > 0 && (
          <div className="cards">
            {lista.map((p) => (
              <article key={p.id} className="tarjeta-clicable" style={{ flex: '1 1 300px' }} tabIndex={0} role="button" onClick={() => navigate(`/m16-pedidos/${p.id}`)} onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/m16-pedidos/${p.id}`); }}>
                <Badge variant={p.estado === 'Recibido' ? 'success' : p.estado === 'Reclamo' ? 'danger' : 'info'}>{ETIQUETA_ESTADO_PEDIDO[p.estado]}</Badge>
                <strong>{p.productoNombre}</strong>
                <span className="comentario-meta">{rol === 'comprador' ? `Vendedor: ${p.con}` : `Comprador: ${p.con}`}</span>
                <span>{p.cantidad} × — Total S/ {p.total.toFixed(2)}</span>
                {p.plazoVencido && p.estado === 'PagoConfirmado' && <span className="comentario-meta" style={{ color: 'var(--color-danger, #b3261e)' }}>Plazo de entrega vencido</span>}
              </article>
            ))}
          </div>
        )}
      </RequireRole>
    </section>
  );
}

export default MisPedidosPage;
