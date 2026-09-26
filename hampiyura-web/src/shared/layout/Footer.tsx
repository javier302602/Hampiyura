import Logo from '../ui/Logo';
import { MessageCircle } from 'lucide-react';
import SessionBar from '../auth/SessionBar';
import type { NavCallbacks } from './Header';

type Props = Pick<NavCallbacks, 'onIrAHome' | 'onIrACatalogo' | 'onIrAMapaCultivo' | 'onIrAPublicaciones' | 'onIrAProductos' | 'onIrAEnviarConsulta' | 'onIrAUsos'>;

// Número real confirmado por el usuario (+51, Perú) -- antes de esto no había ningún contacto de
// WhatsApp en la app; se arma el enlace wa.me con mensaje prellenado en vez de solo mostrar el
// número como texto suelto.
const WHATSAPP_NUMERO = '51972489183';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent('Hola, tengo una consulta sobre HampiYura.')}`;

// Contenido derivado de funcionalidad real ya construida en la app (no inventado): registro
// personal/empresa (RegistroPage), comisión del 5% (PublicarProductoUseCase/PerfilPage), Proponer
// planta (Frente 4), validación por área/administrador (RN-05, M-09), y consultas sin cuenta
// (mismo texto ya usado en HomePage: "con o sin cuenta").
const FAQ_ITEMS = [
  {
    pregunta: '¿Cómo me registro?',
    respuesta: 'Puedes crear una cuenta personal, que queda activa de inmediato, o registrar tu emprendimiento, que requiere activarla con un enlace antes de poder publicar productos.',
  },
  {
    pregunta: '¿Qué es la comisión del 5%?',
    respuesta: 'Al publicar tu primer producto como productor, aceptas una comisión mínima del 5% sobre las ventas que se concreten a partir de tu publicación. A cambio, tu producto aparece en el directorio público con su ficha, fotos, mapa y contacto, después de una revisión del equipo. Se pide una sola vez por cuenta, no en cada publicación.',
  },
  {
    pregunta: '¿Cómo propongo una planta que no está en el catálogo?',
    respuesta: 'Desde "Proponer planta" (junto a "Publicar producto" en el menú) completas nombre común, nombre científico, familia, región y hábitat. Queda "Pendiente" hasta que el equipo la revise.',
  },
  {
    pregunta: '¿Quién revisa lo que la comunidad publica?',
    respuesta: 'Un especialista del área correspondiente o un administrador, desde la bandeja de validación. Nada de lo propuesto aparece en público hasta ser aprobado.',
  },
  {
    pregunta: '¿Necesito una cuenta para hacer una consulta?',
    respuesta: 'No -- puedes enviar una consulta a un especialista con o sin cuenta. Solo necesitas iniciar sesión si quieres hacerle seguimiento desde "Mis consultas".',
  },
];

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
            <span className="site-footer-brand-name"><Logo size={32} /> HampiYura</span>
            <p className="site-footer-tagline">Saberes que echan raíces: plantas amazónicas, conocimiento comunitario y territorio.</p>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="footer-whatsapp-btn">
              <MessageCircle size={16} aria-hidden="true" /> Escríbenos por WhatsApp
            </a>
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

        <div className="site-footer-faq">
          <h3>Preguntas frecuentes</h3>
          <div className="site-footer-faq-grid">
            {FAQ_ITEMS.map((item) => (
              <details key={item.pregunta} className="site-footer-faq-item">
                <summary>{item.pregunta}</summary>
                <p>{item.respuesta}</p>
              </details>
            ))}
          </div>
        </div>

        <div className="site-footer-bottom">
          <span>© {anio} HampiYura. Fotografía de portada: Wikimedia Commons.</span>
          {/* Herramienta de desarrollo: solo se incluye en `npm run dev`; el build de producción
              (import.meta.env.DEV === false) la elimina por completo, no se muestra en un servidor real. */}
          {import.meta.env.DEV && (
            <details className="site-footer-dev">
              <summary>Modo desarrollo: iniciar sesión con un token JWT</summary>
              <div style={{ marginTop: 'var(--space-2)' }}><SessionBar /></div>
            </details>
          )}
        </div>
      </div>
    </footer>
  );
}

export default Footer;
