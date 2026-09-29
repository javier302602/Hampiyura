import { useNavigate } from "react-router-dom";
import { Bell, Flag, Wallet, FlaskConical, Home, Inbox, LayoutDashboard, LogOut, MessageSquare, Package, ShoppingBag, Sprout, TreeDeciduous, UserRound, Users, X } from 'lucide-react';
import type { Session } from '../auth/session';
import { clearSession, esAdministrador, esValidador } from '../auth/session';
import SearchBar from '../../modules/m12-busqueda-recomendaciones/components/SearchBar';
import Button from '../ui/Button';
import ThemeToggle from '../theme/ThemeToggle';
import type { NavCallbacks } from './Header';

interface Props extends NavCallbacks {
  sesion: Session | null;
  puedeGestionar: boolean;
  onCerrar: () => void;
}

// Drawer de navegación para <900px -- agrupa exactamente las mismas acciones que el Header de
// escritorio (misma prop NavCallbacks, mismo gateo por rol), en vez de que la nav dependa
// únicamente de flex-wrap como antes (ver auditoría, hallazgo #10).
function MobileNav({ sesion, puedeGestionar, onCerrar, ...nav }: Props) {
  const navigate = useNavigate();
  function ir(callback: () => void) {
    onCerrar();
    callback();
  }

  return (
    <>
      <div className="mobile-nav-backdrop" onClick={onCerrar} />
      <div className="mobile-nav-drawer" role="dialog" aria-modal="true" aria-label="Menú de navegación">
        <div className="mobile-nav-drawer-header">
          <strong>Menú</strong>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <ThemeToggle />
            <button className="icon-btn" onClick={onCerrar} aria-label="Cerrar menú"><X size={18} aria-hidden="true" /></button>
          </div>
        </div>

        <SearchBar tono="surface" onBuscar={(f) => { onCerrar(); nav.onBuscar(f); }} />
        <div className="mobile-nav-drawer-divider" />

        <button onClick={() => ir(nav.onIrAHome)}><Home size={17} aria-hidden="true" /> Inicio</button>
        <button onClick={() => ir(nav.onIrACatalogo)}><Sprout size={17} aria-hidden="true" /> Plantas</button>
        <button onClick={() => ir(nav.onIrAMapaCultivo)}><Sprout size={17} aria-hidden="true" /> Cultivo</button>
        <button onClick={() => ir(nav.onIrAEnviarConsulta)}><MessageSquare size={17} aria-hidden="true" /> Consultas</button>
        <button onClick={() => ir(nav.onIrAPublicaciones)}><FlaskConical size={17} aria-hidden="true" /> Publicaciones</button>
        <button onClick={() => ir(nav.onIrAProductos)}><Package size={17} aria-hidden="true" /> Productos</button>

        {puedeGestionar && (
          <>
            <div className="mobile-nav-drawer-divider" />
            <span className="dropdown-panel-label">Gestión</span>
            {/* Bug real encontrado al revisar esta pantalla: mostraba "Panel admin" a cualquier
                validador (no solo Administrador) porque solo chequeaba puedeGestionar -- el
                dropdown "Gestión" del Header de escritorio sí distinguía esAdministrador() acá;
                se corrige para que ambos coincidan exactamente. */}
            {sesion && esValidador(sesion.rol) && (
              <>
                <button onClick={() => ir(nav.onIrABandejaValidacion)}><FlaskConical size={17} aria-hidden="true" /> Bandeja de validación</button>
                <button onClick={() => ir(nav.onIrABandejaConsultas)}><Inbox size={17} aria-hidden="true" /> Bandeja de consultas</button>
                <button onClick={() => ir(nav.onIrABandejaReportes)}><Flag size={17} aria-hidden="true" /> Bandeja de reportes</button>
                <button onClick={() => ir(nav.onIrARegistrarFichaCultivo)}><Sprout size={17} aria-hidden="true" /> Registrar ficha de cultivo</button>
                <button onClick={() => ir(nav.onIrAPanelAdmin)}><LayoutDashboard size={17} aria-hidden="true" /> {sesion && esAdministrador(sesion.rol) ? 'Panel admin' : 'Mi panel'}</button>
              </>
            )}
            {sesion && esAdministrador(sesion.rol) && (
              <>
                <button onClick={() => ir(nav.onIrAUsuariosAdmin)}><Users size={17} aria-hidden="true" /> Usuarios</button>
                <button onClick={() => ir(nav.onIrAPagosAdmin)}><Wallet size={17} aria-hidden="true" /> Pagos y planes</button>
                <button onClick={() => ir(nav.onIrAReclamosPedidos)}><ShoppingBag size={17} aria-hidden="true" /> Reclamos de pedidos</button>
              </>
            )}
          </>
        )}

        <div className="mobile-nav-drawer-divider" />
        <Button variant="primary" fullWidth iconLeft={<TreeDeciduous size={15} aria-hidden="true" />} onClick={() => ir(nav.onIrAProponerPlanta)}>
          Proponer planta
        </Button>
        <Button variant="primary" fullWidth iconLeft={<Sprout size={15} aria-hidden="true" />} onClick={() => ir(nav.onIrAPublicarProducto)}>
          Publicar producto
        </Button>

        <div className="mobile-nav-drawer-divider" />
        {sesion ? (
          <>
            <button onClick={() => ir(nav.onIrAPerfil)}><UserRound size={17} aria-hidden="true" /> Mi perfil</button>
            <button onClick={() => ir(nav.onIrAMisConsultas)}><MessageSquare size={17} aria-hidden="true" /> Mis consultas</button>
            <button onClick={() => ir(nav.onAbrirNotificaciones)}><Bell size={17} aria-hidden="true" /> Notificaciones</button>
            <button onClick={() => ir(() => navigate('/m15-planes/mensajes'))}><MessageSquare size={17} aria-hidden="true" /> Mensajes</button>
            <button onClick={() => ir(() => navigate('/m15-planes/alertas'))}><Bell size={17} aria-hidden="true" /> Mis alertas</button>
            <button onClick={() => ir(() => navigate('/m15-planes/mi-plan'))}><UserRound size={17} aria-hidden="true" /> Mi plan</button>
            <button onClick={() => { onCerrar(); clearSession(); }}><LogOut size={17} aria-hidden="true" /> Cerrar sesión</button>
          </>
        ) : (
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button variant="secondary" fullWidth onClick={() => ir(nav.onIrALogin)}>Iniciar sesión</Button>
            <Button variant="primary" fullWidth onClick={() => ir(nav.onIrARegistro)}>Registrarse</Button>
          </div>
        )}
      </div>
    </>
  );
}

export default MobileNav;
