import { ReactNode, useEffect, useState } from 'react';
import SessionBar from '../auth/SessionBar';
import { esAdministrador, esValidador, getSession, suscribirseACambiosDeSesion } from '../auth/session';
import UserMenu from '../../modules/m01-cuentas/components/UserMenu';
import SearchBar from '../../modules/m12-busqueda-recomendaciones/components/SearchBar';
import NotificacionesIndicador from '../../modules/m14-notificaciones/components/NotificacionesIndicador';
import type { FiltrosBusqueda } from '../../modules/m12-busqueda-recomendaciones/api/busqueda.api';

interface Props {
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
  children: ReactNode;
}

// No existía un layout compartido antes de M-12 -- se crea aquí, mínimo, porque la barra de
// búsqueda debe quedar accesible desde cualquier pantalla (no solo desde una página concreta).
// Reúne el "chrome" que ya vivía suelto en App.tsx (encabezado, SessionBar, secciones siempre
// visibles de bandeja/panel admin) para que quede en un solo lugar en vez de duplicarlo.
// Las bandejas ya no se renderizan aquí: cada una tiene una URL propia y App.tsx las monta
// mediante React Router, para que atrás/adelante y los enlaces compartibles sean reales.
function Layout({ onBuscar, onAbrirNotificaciones, onIrALogin, onIrARegistro, onIrAPerfil, onIrAMisConsultas, onIrAEnviarConsulta, onIrAMapaCultivo, onIrAUsos, onIrAPublicaciones, onIrAProductos, onIrAPublicarProducto, onIrABandejaValidacion, onIrABandejaConsultas, onIrAPanelAdmin, children }: Props) {
  const [sesion, setSesion] = useState(getSession());
  useEffect(() => suscribirseACambiosDeSesion(() => setSesion(getSession())), []);

  return (
    <main>
      <div className="hero">
        <div className="hero-contenido">
          <p className="eyebrow">HAMPIYURA · SABERES VIVOS</p>
          <h1>Saberes que echan raíces.</h1>
          <p>Explora plantas amazónicas, conecta conocimiento comunitario y ayuda a cuidar el territorio.</p>
        </div>
        <div className="hero-acciones">
          <UserMenu onIrALogin={onIrALogin} onIrARegistro={onIrARegistro} onIrAPerfil={onIrAPerfil} onIrAMisConsultas={onIrAMisConsultas} />
          <NotificacionesIndicador onAbrir={onAbrirNotificaciones} />
          {/* Ítem de navegación público (sin sesión), igual de accesible que el catálogo -- ver
              CG-004: el mapa dejó de ser un botón perdido dentro de la lista de módulos. */}
          <button onClick={onIrAMapaCultivo}>Mapa</button>
          <button className="accion-principal" onClick={onIrAEnviarConsulta}>Ayuda / Contacto</button>
          <button onClick={onIrAUsos}>Usos</button>
          <button onClick={onIrAPublicaciones}>Publicaciones</button>
          <button onClick={onIrAProductos}>Productos</button>
          <button className="accion-principal" onClick={onIrAPublicarProducto}>Publicar producto</button>
          {sesion && esValidador(sesion.rol) && <button onClick={onIrABandejaValidacion}>Validación</button>}
          {sesion && esValidador(sesion.rol) && <button onClick={onIrABandejaConsultas}>Bandeja de consultas</button>}
          {sesion && esAdministrador(sesion.rol) && <button onClick={onIrAPanelAdmin}>Panel admin</button>}
        </div>
        {!sesion && (
          <details style={{ margin: '.6rem 0' }}>
            <summary style={{ cursor: 'pointer' }}>Modo desarrollo: iniciar sesión pegando un token JWT manualmente</summary>
            <SessionBar />
          </details>
        )}
        <SearchBar onBuscar={onBuscar} />
        <p className="hero-credit">Fotografía: Wikimedia Commons · Sangre de grado (Croton lechleri)</p>
      </div>
      <div className="cards">
        <article><strong>M-01</strong><span>Cuentas</span></article>
        <article><strong>M-03</strong><span>Cultivo</span></article>
        <article><strong>M-09</strong><span>Validación</span></article>
      </div>

      {children}

    </main>
  );
}

export default Layout;
