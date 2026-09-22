import type { TipoConocimiento } from '../api/partes-uso.api';

const CLASE_POR_TIPO: Record<TipoConocimiento, string> = {
  Tradicional: 'badge badge-tradicional',
  Documentado: 'badge badge-documentado',
  Científico: 'badge badge-cientifico',
  Pendiente: 'badge badge-pendiente',
};

function TipoConocimientoBadge({ tipo }: { tipo: TipoConocimiento }) {
  return <span className={CLASE_POR_TIPO[tipo] ?? 'badge'}>{tipo}</span>;
}

export default TipoConocimientoBadge;
