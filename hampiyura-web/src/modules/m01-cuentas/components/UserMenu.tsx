import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, LogOut, Mail, MessageSquare, UserRound, WalletCards } from 'lucide-react';
import { obtenerPerfil, type Perfil } from '../api/cuentas.api';
import { getSession, clearSession, suscribirseACambiosDeSesion } from '../../../shared/auth/session';
import useDropdown from '../../../shared/hooks/useDropdown';
import Button from '../../../shared/ui/Button';
import Avatar from '../../../shared/ui/Avatar';

interface Props {
  onIrALogin: () => void;
  onIrARegistro: () => void;
  onIrAPerfil: () => void;
  onIrAMisConsultas: () => void;
}

// Reemplaza a SessionBar como forma PRINCIPAL de entrar/ver la sesión -- SessionBar se mantiene
// disponible aparte (modo desarrollo, ahora en el footer) para pruebas rápidas con un token pegado
// a mano. Logueado, ahora es un menú desplegable (avatar + nombre) en vez de 3 botones sueltos en
// la fila de navegación -- mismo estado/lógica de sesión de antes, solo cambia cómo se presenta.
function UserMenu({ onIrALogin, onIrARegistro, onIrAPerfil, onIrAMisConsultas }: Props) {
  const navigate = useNavigate();
  const [sesion, setSesion] = useState(getSession());
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const { ref, abierto, setAbierto, alternar } = useDropdown<HTMLDivElement>();

  function cargarPerfil() {
    if (!getSession()) { setPerfil(null); return; }
    obtenerPerfil().then(setPerfil).catch(() => setPerfil(null));
  }

  useEffect(() => suscribirseACambiosDeSesion(() => { setSesion(getSession()); cargarPerfil(); }), []);
  useEffect(cargarPerfil, []);

  if (!sesion) {
    return (
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        <Button variant="onBrand" size="sm" onClick={onIrALogin}>Iniciar sesión</Button>
        <Button variant="primary" size="sm" onClick={onIrARegistro}>Registrarse</Button>
      </div>
    );
  }

  const nombre = perfil?.nombre ?? '…';

  return (
    <div className="dropdown" ref={ref}>
      <button className="user-menu-trigger" onClick={alternar} aria-haspopup="menu" aria-expanded={abierto}>
        <Avatar nombre={nombre} />
        <span className="user-menu-name">{nombre}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      {abierto && (
        <div className="dropdown-panel" role="menu">
          <span className="dropdown-panel-label">{sesion.rol || 'Rol desconocido'}</span>
          <button role="menuitem" onClick={() => { setAbierto(false); onIrAPerfil(); }}>
            <UserRound size={16} aria-hidden="true" /> Mi perfil
          </button>
          <button role="menuitem" onClick={() => { setAbierto(false); onIrAMisConsultas(); }}>
            <MessageSquare size={16} aria-hidden="true" /> Mis consultas
          </button>
          <button role="menuitem" onClick={() => { setAbierto(false); navigate('/m15-planes/mensajes'); }}>
            <Mail size={16} aria-hidden="true" /> Mensajes
          </button>
          <button role="menuitem" onClick={() => { setAbierto(false); navigate('/m15-planes/alertas'); }}>
            <Bell size={16} aria-hidden="true" /> Mis alertas
          </button>
          <button role="menuitem" onClick={() => { setAbierto(false); navigate('/m15-planes/mi-plan'); }}>
            <WalletCards size={16} aria-hidden="true" /> Mi plan
          </button>
          <div className="dropdown-panel-divider" />
          <button role="menuitem" onClick={() => { setAbierto(false); clearSession(); }}>
            <LogOut size={16} aria-hidden="true" /> Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}

export default UserMenu;
