import { ReactNode } from 'react';
import Header, { type NavCallbacks } from './Header';
import AsistenteChat from '../../modules/asistente/components/AsistenteChat';
import Footer from './Footer';

interface Props extends NavCallbacks {
  children: ReactNode;
}

// Antes "Layout.tsx": envolvía cada ruta con el hero de marketing completo (foto, título, fila de
// botones de navegación) -- ver auditoría, hallazgo #1. Ahora es un AppShell real: una barra de
// header persistente y compacta (Header.tsx) fuera de <main>, el contenido de la página en medio,
// y un footer nuevo (Footer.tsx) al final. El hero de marketing pasó a ser exclusivo de
// HomePage.tsx. Mismas props/callbacks de navegación que recibía Layout antes (más onIrAHome/
// onIrACatalogo, nuevos porque "/" ya no redirige directo al catálogo) -- App.tsx no cambia su
// forma de invocar este componente salvo el nombre.
function AppShell({ children, ...nav }: Props) {
  return (
    <>
      <Header {...nav} />
      <main>{children}</main>
      <AsistenteChat />
      <Footer
        onIrAHome={nav.onIrAHome}
        onIrACatalogo={nav.onIrACatalogo}
        onIrAMapaCultivo={nav.onIrAMapaCultivo}
        onIrAPublicaciones={nav.onIrAPublicaciones}
        onIrAProductos={nav.onIrAProductos}
        onIrAEnviarConsulta={nav.onIrAEnviarConsulta}
        onIrAUsos={nav.onIrAUsos}
      />
    </>
  );
}

export default AppShell;
