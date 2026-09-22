import { ButtonHTMLAttributes, ReactNode } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  label: string;
  onBrand?: boolean;
  badge?: number;
}

// Botón de solo-ícono con label accesible obligatorio (aria-label) -- reemplaza patrones como el
// 🔔 emoji suelto de NotificacionesIndicador o el ☰ hamburguesa nuevo del menú móvil. `badge`
// dibuja el contador de no-leídas como una insignia, con el número también en el aria-label (no
// solo color/posición) para que se anuncie por lector de pantalla.
function IconButton({ icon, label, onBrand, badge, className, ...rest }: Props) {
  const clases = ['icon-btn', onBrand ? 'icon-btn-on-brand' : '', className].filter(Boolean).join(' ');
  const etiqueta = badge ? `${label} (${badge} sin leer)` : label;
  return (
    <button className={clases} aria-label={etiqueta} title={etiqueta} {...rest}>
      <span aria-hidden="true" style={{ display: 'flex' }}>{icon}</span>
      {!!badge && <span className="icon-btn-badge" aria-hidden="true">{badge > 9 ? '9+' : badge}</span>}
    </button>
  );
}

export default IconButton;
