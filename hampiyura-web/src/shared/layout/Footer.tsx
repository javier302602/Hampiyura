import { Leaf } from 'lucide-react';
import SessionBar from '../auth/SessionBar';
import type { NavCallbacks } from './Header';

type Props = Pick<NavCallbacks, 'onIrAHome' | 'onIrACatalogo' | 'onIrAMapaCultivo' | 'onIrAPublicaciones' | 'onIrAProductos' | 'onIrAEnviarConsulta' | 'onIrAUsos'>;

// No existía footer antes (ver auditoría). La herramienta de desarrollo (SessionBar, paste-JWT)
// se reubica acá -- misma lógica de siempre, solo cambia dónde se monta (antes flotaba dentro del
// hero de marketing, que ahora es exclusivo de HomePage).
function Footer({ onIrAHome, onIrACatalogo, onIrAMapaCultivo, onIrAPublicaciones, onIrAProductos, onIrAEnviarConsulta, onIrAUsos }: Props) {
  const anio = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-grid">
          <div className="site-footer-brand">
            <span className="site-footer-brand-name"><Leaf size={18} aria-hidden="true" /> HampiYura</span>
            <p className="site-footer-tagline">Saberes que echan raíces: plantas amazónicas, conocimiento comunitario y territorio.</p>
          </div>
          <div className="site-footer-col">
            <h3>Explorar</h3>
            <ul>
              <li><button onClick={onIrAHome}>Inicio</button></li>
              <li><button onClick={onIrACatalogo}>Catálogo de plantas</button></li>
              <li><button onClick={onIrAMapaCultivo}>Mapa de cultivo</button></li>
              <li><button onClick={onIrAUsos}>Usos y saberes</button></li>
            </ul>
          </div>
          <div className="site-footer-col">
            <h3>Comunidad</h3>
            <ul>
              <li><button onClick={onIrAPublicaciones}>Publicaciones</button></li>
              <li><button onClick={onIrAProductos}>Productos</button></li>
              <li><button onClick={onIrAEnviarConsulta}>Consultas y ayuda</button></li>
            </ul>
          </div>
          <div className="site-footer-col">
            <h3>Sobre HampiYura</h3>
            <ul>
              <li><span>Proyecto de saberes vivos amazónicos</span></li>
            </ul>
          </div>
        </div>
        <div className="site-footer-bottom">
          <span>© {anio} HampiYura. Fotografía de portada: Wikimedia Commons.</span>
          <details className="site-footer-dev">
            <summary>Modo desarrollo: iniciar sesión con un token JWT</summary>
            <div style={{ marginTop: 'var(--space-2)' }}><SessionBar /></div>
          </details>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
