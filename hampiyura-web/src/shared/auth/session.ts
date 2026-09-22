export interface Session { token: string; rol: string; userId: string; }
const KEY = 'hampiyura.session';
const EVENTO_CAMBIO = 'hampiyura:session-changed';

// RequireRole (y cualquier otro componente) puede suscribirse a esto para re-renderizar cuando
// la sesión cambia en otra parte del árbol (ej. SessionBar) -- sin esto, un componente que solo
// lee getSession() en el render queda con el valor viejo hasta que algo más fuerce un re-render.
function notificarCambioSesion() {
  try { window.dispatchEvent(new Event(EVENTO_CAMBIO)); } catch { /* SSR o entorno sin window */ }
}
export function suscribirseACambiosDeSesion(callback: () => void): () => void {
  window.addEventListener(EVENTO_CAMBIO, callback);
  return () => window.removeEventListener(EVENTO_CAMBIO, callback);
}

function decodificarPayload(token: string): { rol: string; userId: string } {
  try {
    const payload = JSON.parse(atob(token.split('.')[1] ?? ''));
    return { rol: typeof payload.rol === 'string' ? payload.rol : '', userId: typeof payload.sub === 'string' ? payload.sub : '' };
  } catch {
    return { rol: '', userId: '' };
  }
}

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function setSessionToken(token: string): Session {
  const session: Session = { token, ...decodificarPayload(token) };
  try { localStorage.setItem(KEY, JSON.stringify(session)); } catch { /* almacenamiento no disponible */ }
  notificarCambioSesion();
  return session;
}

export function clearSession() {
  try { localStorage.removeItem(KEY); } catch { /* almacenamiento no disponible */ }
  notificarCambioSesion();
}

// Mismo criterio que requireValidator en el backend: Administrador o cualquier Especialista_*.
export function esValidador(rol: string): boolean { return rol === 'Administrador' || rol.startsWith('Especialista'); }
export function esAdministrador(rol: string): boolean { return rol === 'Administrador'; }
// Mismo criterio que requireProductor en el backend: solo Productor o Administrador puede publicar.
export function esProductor(rol: string): boolean { return rol === 'Productor' || rol === 'Administrador'; }
