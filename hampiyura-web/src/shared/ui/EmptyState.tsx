import { ReactNode } from 'react';
import { Sprout } from 'lucide-react';

interface Props {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

// Reemplaza el patrón "<p>Todavía no hay X</p>" repetido sin estilo en casi toda la app (ver
// auditoría) -- por ahora se usa desde HomePage; el resto de las páginas se migra en sus propias
// etapas.
function EmptyState({ title, description, icon, action }: Props) {
  return (
    <div className="state-block">
      <span className="state-block-icon">{icon ?? <Sprout size={22} aria-hidden="true" />}</span>
      <p className="state-block-title">{title}</p>
      {description && <p className="state-block-desc">{description}</p>}
      {action}
    </div>
  );
}

export default EmptyState;
