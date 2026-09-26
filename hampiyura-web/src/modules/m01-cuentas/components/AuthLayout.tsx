import { ReactNode } from 'react';

interface Props {
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}

// Login/Registro (y por extensión Recuperar/Activar/Restablecer, misma familia) vivían como un
// <h2> + .formulario suelto, sin nada de la identidad visual que ya tiene Home (foto real, franja
// de marca) -- ver auditoría ronda 3, punto 5. En vez de reinventar el hero, este layout reusa el
// token de foto propio (--auth-photo, río Ucayali) en un panel lateral: columna de contenido a
// la izquierda, foto+cita a la derecha. En mobile la foto se oculta (ver auth.css) para no robarle
// espacio al formulario, que es lo que la persona vino a usar.
function AuthLayout({ eyebrow, title, description, children, footer }: Props) {
  return (
    <div className="auth-layout">
      <div className="auth-panel">
        {/* Marca centrada y grande. Claro: logo completo (texto verde oscuro sobre transparente). Oscuro: emblema sin caja + nombre y
            lema como TEXTO real claro (el logo completo no se lee sobre verde oscuro); CSS elige cuál según el tema. */}
        <div className="auth-brand">
          <img className="auth-brand-completo" src="/img/logo-hampiyura.png" alt="HampiYura — plataforma digital de plantas medicinales de la Amazonía" width="240" height="240" />
          <div className="auth-brand-oscuro">
            <img src="/img/logo-emblema.png" alt="" width="150" height="150" />
            <span className="auth-brand-nombre">HampiYura</span>
            <span className="auth-brand-lema">Plataforma digital de plantas medicinales de la Amazonía</span>
          </div>
        </div>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="auth-title">{title}</h1>
        {description && <p className="auth-desc">{description}</p>}
        <div className="auth-card">{children}</div>
        {footer && <div className="auth-footer">{footer}</div>}
      </div>
      <div className="auth-photo" aria-hidden="true">
        <div className="auth-photo-quote">
          <p>&ldquo;Cada planta documentada es conocimiento tradicional que se preserva para la comunidad.&rdquo;</p>
          <span className="auth-photo-credit">Río Ucayali, Amazonía central del Perú · NASA (dominio público)</span>
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
