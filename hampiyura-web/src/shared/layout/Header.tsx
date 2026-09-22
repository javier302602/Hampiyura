import { useEffect, useState } from 'react';
import { ChevronDown, FlaskConical, Inbox, LayoutDashboard, Leaf, Menu, Sprout, Users } from 'lucide-react';
import { esAdministrador, esValidador, getSession, suscribirseACambiosDeSesion } from '../auth/session';
import UserMenu from '../../modules/m01-cuentas/components/UserMenu';
import SearchBar from '../../modules/m12-busqueda-recomendaciones/components/SearchBar';
import NotificacionesIndicador from '../../modules/m14-notificaciones/components/NotificacionesIndicador';
import useDropdown from '../hooks/useDropdown';
import Button from '../ui/Button';
import MobileNav from './MobileNav';
import type { FiltrosBusqueda } from '../../modules/m12-busqueda-recomendaciones/api/busqueda.api';

export interface NavCallbacks {
  onBuscar: (filtros: FiltrosBusqueda) => void;
  onAbrirNotificaciones: () => void;
  onIrALogin: () => void;
  onIrARegistro: () => void;
  onIrAPerfil: () => void;
  onIrAMisConsultas: () => void;
  onIrAEnviarConsulta: () => void;
  onIrAMapaCultivo: () => void;
  onIrAUsos: () => void;
  onIrAPublicaciones: () => void;
  onIrAProductos: () => void;
  onIrAPublicarProducto: () => void;
  onIrABandejaValidacion: () => void;
  onIrABandejaConsultas: () => void;
  onIrAPanelAdmin: () => void;
  onIrAUsuariosAdmin: () => void;
  onIrAHome: () => void;
  onIrACatalogo: () => void;
}

// Reemplaza la fila plana de 9+ botones que antes vivía dentro de .hero (ver auditoría, hallazgo
// #2): nav agrupada por frecuencia de uso, accesos por rol reunidos en un único dropdown
// "Gestión" en vez de 3 botones sueltos, y todo el chrome (búsqueda, notificaciones, sesión) queda
// en una barra propia y persistente en TODAS las rutas -- ya no dentro del hero de marketing, que
// ahora es exclusivo de HomePage. La lógica de sesión/roles (esValidador/esAdministrador) es la
// misma de siempre, solo cambia cómo se agrupa visualmente.
function Header(props: NavCallbacks) {
  const [sesion, setSesion] = useState(getSession());
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const gestion = useDropdown<HTMLDivElement>();
  useEffect(() => suscribirseACambiosDeSesion(() => setSesion(getSession())), []);

  const puedeGestionar = !!sesion && (esValidador(sesion.rol) || esAdministrador(sesion.rol));

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <button className="site-header-logo" onClick={props.onIrAHome} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <span className="site-header-logo-mark" aria-hidden="true"><Leaf size={18} /></span>
          HampiYura
        </button>

        <nav className="site-header-nav" aria-label="Navegación principal">
          <button onClick={props.onIrAHome}>Inicio</button>
          <button onClick={props.onIrACatalogo}>Plantas</button>
          <button onClick={props.onIrAMapaCultivo}>Cultivo</button>
          <button onClick={props.onIrAEnviarConsulta}>Consultas</button>
          <button onClick={props.onIrAPublicaciones}>Publicaciones</button>
          <button onClick={props.onIrAProductos}>Productos</button>
          {puedeGestionar && (
            <div className="dropdown" ref={gestion.ref}>
              <button onClick={gestion.alternar} aria-haspopup="menu" aria-expanded={gestion.abierto}>
                Gestión <ChevronDown size={14} aria-hidden="true" />
              </button>
              {gestion.abierto && (
                <div className="dropdown-panel" role="menu">
                  {sesion && esValidador(sesion.rol) && (
                    <button role="menuitem" onClick={() => { gestion.setAbierto(false); props.onIrABandejaValidacion(); }}>
                      <FlaskConical size={16} aria-hidden="true" /> Bandeja de validación
                    </button>
                  )}
                  {sesion && esValidador(sesion.rol) && (
                    <button role="menuitem" onClick={() => { gestion.setAbierto(false); props.onIrABandejaConsultas(); }}>
                      <Inbox size={16} aria-hidden="true" /> Bandeja de consultas
                    </button>
                  )}
                  {sesion && esAdministrador(sesion.rol) && (
                    <button role="menuitem" onClick={() => { gestion.setAbierto(false); props.onIrAPanelAdmin(); }}>
                      <LayoutDashboard size={16} aria-hidden="true" /> Panel admin
                    </button>
                  )}
                  {sesion && esAdministrador(sesion.rol) && (
                    <button role="menuitem" onClick={() => { gestion.setAbierto(false); props.onIrAUsuariosAdmin(); }}>
                      <Users size={16} aria-hidden="true" /> Usuarios
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </nav>

        <div className="site-header-actions">
          <SearchBar onBuscar={props.onBuscar} />
          {/* Oculto <900px (ver header.css) -- el mismo set de acciones vive en MobileNav, no se
              pierde nada, solo cambia dónde vive para no desbordar la barra (bug real encontrado
              en la verificación: sin esto, "Publicar producto" se salía de la pantalla en móvil). */}
          <div className="site-header-actions-desktop">
            <Button variant="primary" size="sm" iconLeft={<Sprout size={15} aria-hidden="true" />} onClick={props.onIrAPublicarProducto}>
              Publicar producto
            </Button>
            <NotificacionesIndicador onAbrir={props.onAbrirNotificaciones} />
            <UserMenu onIrALogin={props.onIrALogin} onIrARegistro={props.onIrARegistro} onIrAPerfil={props.onIrAPerfil} onIrAMisConsultas={props.onIrAMisConsultas} />
          </div>
          <button className="site-header-hamburger icon-btn icon-btn-on-brand" onClick={() => setMenuMovilAbierto(true)} aria-label="Abrir menú">
            <Menu size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      {menuMovilAbierto && (
        <MobileNav {...props} sesion={sesion} puedeGestionar={puedeGestionar} onCerrar={() => setMenuMovilAbierto(false)} />
      )}
    </header>
  );
}

export default Header;
