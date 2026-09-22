import { HTMLAttributes, KeyboardEvent, ReactNode } from 'react';

interface Props extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  children: ReactNode;
}

// Primitivo de tarjeta -- base compartida para PlantCard y, en etapas siguientes, para unificar
// ProductoCard/PublicacionCard (hoy cada una reimplementa el mismo patrón a mano, ver auditoría).
// Cuando es interactive, responde a teclado (Enter/Espacio) además de click -- las tarjetas
// clicables actuales (<article onClick>) no eran accesibles por teclado (ver auditoría).
function Card({ interactive, className, onClick, onKeyDown, children, ...rest }: Props) {
  const clases = ['card-ui', interactive ? 'card-ui-interactive' : '', className].filter(Boolean).join(' ');
  return (
    <div
      className={clases}
      tabIndex={interactive ? 0 : undefined}
      role={interactive ? 'button' : undefined}
      onClick={onClick}
      onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
        onKeyDown?.(e);
        if (interactive && onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          e.currentTarget.click();
        }
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

export default Card;
