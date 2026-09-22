import { ReactNode } from 'react';

export type BadgeVariant = 'neutral' | 'success' | 'warning' | 'info' | 'danger' | 'accent';

interface Props {
  variant?: BadgeVariant;
  icon?: ReactNode;
  children: ReactNode;
}

// Badge consolidado del design system -- ver styles/components/badge.css para el porqué convive
// con las clases .badge-*/.advertencia-*/.aviso-legal viejas (todavía en uso en m04/m05/m10/etc.,
// se remapean módulo por módulo en las próximas etapas, no todas de una vez).
function Badge({ variant = 'neutral', icon, children }: Props) {
  return (
    <span className={`badge-ui badge-ui-${variant}`}>
      {icon && <span aria-hidden="true" style={{ display: 'flex' }}>{icon}</span>}
      {children}
    </span>
  );
}

export default Badge;
