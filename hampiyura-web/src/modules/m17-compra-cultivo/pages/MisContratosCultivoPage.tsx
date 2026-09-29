import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { misContratosCultivo, ETIQUETA_ESTADO_CONTRATO_CULTIVO, RUTAS_CONTRATOS_CULTIVO, type ContratoCultivoResumen } from '../api/contratos-cultivo.api';
import RequireRole from '../../../shared/auth/RequireRole';
import Button from '../../../shared/ui/Button';
import Badge from '../../../shared/ui/Badge';
import SectionHeader from '../../../shared/ui/SectionHeader';
import LoadingState from '../../../shared/ui/LoadingState';
import EmptyState from '../../../shared/ui/EmptyState';

// M-17 · Mis contratos de compra directa de cosecha: como comprador (lo que propusiste) o como agricultor (lo que te propusieron).
function MisContratosCultivoPage() {
  const navigate = useNavigate();
  const [rol, setRol] = useState<'comprador' | 'agricultor'>('comprador');
  const [lista, setLista] = useState<ContratoCultivoResumen[] | null>(null);
  useEffect(() => { setLista(null); misContratosCultivo(rol).then(setLista).catch(() => setLista([])); }, [rol]);

  return (
    <section>
      <SectionHeader eyebrow="Compra directa de cosecha" title="Mis contratos de cultivo" description="Hipótesis de flujo aún sin validar con un agricultor o comprador real: sirve para probar el proceso completo." />
      <RequireRole permitido={() => true}>
        <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1rem' }}>
          <Button variant={rol === 'comprador' ? 'primary' : 'secondary'} onClick={() => setRol('comprador')}>Lo que propuse</Button>
          <Button variant={rol === 'agricultor' ? 'primary' : 'secondary'} onClick={() => setRol('agricultor')}>Lo que me propusieron</Button>
        </div>
        {!lista && <LoadingState label="Cargando contratos" />}
        {lista && lista.length === 0 && <EmptyState title={rol === 'comprador' ? 'Todavía no propusiste ningún contrato' : 'Todavía no te propusieron ningún contrato'} description="Las propuestas de compra directa de cosecha aparecerán aquí." />}
        {lista && lista.length > 0 && (
          <div className="cards">
            {lista.map((c) => (
              <article key={c.id} className="tarjeta-clicable" style={{ flex: '1 1 300px' }} tabIndex={0} role="button" onClick={() => navigate(RUTAS_CONTRATOS_CULTIVO.detalle(c.id))} onKeyDown={(e) => { if (e.key === 'Enter') navigate(RUTAS_CONTRATOS_CULTIVO.detalle(c.id)); }}>
                <Badge variant={c.estado === 'Completado' ? 'success' : c.estado === 'Rechazado' || c.estado === 'Cancelado' ? 'neutral' : 'info'}>{ETIQUETA_ESTADO_CONTRATO_CULTIVO[c.estado]}</Badge>
                <strong>{c.plantaNombre}</strong>
                <span className="comentario-meta">{rol === 'comprador' ? `Agricultor: ${c.con}` : `Comprador: ${c.con}`}</span>
                <span>{c.cantidad} — S/ {c.montoAcordado.toFixed(2)}</span>
              </article>
            ))}
          </div>
        )}
      </RequireRole>
    </section>
  );
}

export default MisContratosCultivoPage;
