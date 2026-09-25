export interface Session { token: string; rol: string; userId: string; exp?: number; }
const KEY = 'hampiyura.session';
const AVISO_KEY = 'hampiyura.sesion-expirada';
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

function decodificarPayload(token: string): { rol: string; userId: string; exp?: number } {
  try {
    const payload = JSON.parse(atob(token.split('.')[1] ?? ''));
    return {
      rol: typeof payload.rol === 'string' ? payload.rol : '',
      userId: typeof payload.sub === 'string' ? payload.sub : '',
      exp: typeof payload.exp === 'number' ? payload.exp : undefined,
    };
  } catch {
    return { rol: '', userId: '' };
  }
}

// El JWT dura 1 día pero la sesión vive en localStorage: pasado ese día la app seguía mostrándose
// "con sesión iniciada" mientras toda acción autenticada (proponer planta, publicar producto...)
// fallaba con 401. Una sesión vencida se descarta acá (y se deja un aviso para explicarlo), en vez de
// devolverse como si siguiera siendo válida.
export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as Session;
    const exp = session.exp ?? decodificarPayload(session.token).exp;
    if (exp && exp * 1000 <= Date.now()) {
      localStorage.removeItem(KEY);
      localStorage.setItem(AVISO_KEY, '1');
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function setSessionToken(token: string): Session {
  const session: Session = { token, ...decodificarPayload(token) };
  try { localStorage.setItem(KEY, JSON.stringify(session)); localStorage.removeItem(AVISO_KEY); } catch { /* almacenamiento no disponible */ }
  notificarCambioSesion();
  return session;
}

export function clearSession() {
  try { localStorage.removeItem(KEY); } catch { /* almacenamiento no disponible */ }
  notificarCambioSesion();
}

// El backend rechazó el token (vencido o inválido): se cierra la sesión Y se deja constancia del
// motivo para que Login/RequireRole puedan explicarlo -- clearSession() solo, dejaría a la persona
// con un "Inicia sesión" sin contexto de por qué de pronto ya no lo está.
export function expirarSesion() {
  try { localStorage.setItem(AVISO_KEY, '1'); } catch { /* almacenamiento no disponible */ }
  clearSession();
}
export function hayAvisoDeSesionExpirada(): boolean {
  try { return localStorage.getItem(AVISO_KEY) === '1'; } catch { return false; }
}
export function descartarAvisoDeSesionExpirada() {
  try { localStorage.removeItem(AVISO_KEY); } catch { /* almacenamiento no disponible */ }
}

// Mismo criterio que requireValidator en el backend: Administrador o cualquier Especialista_*.
export function esValidador(rol: string): boolean { return rol === 'Administrador' || rol.startsWith('Especialista'); }
export function esAdministrador(rol: string): boolean { return rol === 'Administrador'; }
// Mismo criterio que requireProductor en el backend: solo Productor o Administrador puede publicar.
export function esProductor(rol: string): boolean { return rol === 'Productor' || rol === 'Administrador'; }
