export type Tema = 'light' | 'dark';

const STORAGE_KEY = 'hampiyura.tema';
const EVENTO_CAMBIO = 'hampiyura:tema-changed';

// Colores reales de <meta name="theme-color"> (index.html) -- se actualiza el que corresponda al
// tema activo para que el chrome del navegador (barra de dirección en móvil) no quede mostrando el
// color del tema contrario tras un cambio manual.
const THEME_COLOR: Record<Tema, string> = { light: '#f4f1e8', dark: '#0f2620' };

function sistemaPrefiereOscuro(): boolean {
  try { return window.matchMedia('(prefers-color-scheme: dark)').matches; } catch { return false; }
}

// Mismo criterio que el script inline de index.html (evita el flash inicial): localStorage gana si
// existe, si no, el tema del sistema operativo es el valor por defecto la primera vez.
export function obtenerTemaActual(): Tema {
  try {
    const guardado = localStorage.getItem(STORAGE_KEY);
    if (guardado === 'light' || guardado === 'dark') return guardado;
  } catch { /* almacenamiento no disponible */ }
  return sistemaPrefiereOscuro() ? 'dark' : 'light';
}

export function establecerTema(tema: Tema) {
  try { localStorage.setItem(STORAGE_KEY, tema); } catch { /* almacenamiento no disponible */ }
  document.documentElement.setAttribute('data-theme', tema);
  document.querySelectorAll(`meta[name="theme-color"]`).forEach((meta) => meta.setAttribute('content', THEME_COLOR[tema]));
  try { window.dispatchEvent(new Event(EVENTO_CAMBIO)); } catch { /* SSR o entorno sin window */ }
}

export function alternarTema(): Tema {
  const siguiente: Tema = obtenerTemaActual() === 'dark' ? 'light' : 'dark';
  establecerTema(siguiente);
  return siguiente;
}

export function suscribirseACambiosDeTema(callback: () => void): () => void {
  window.addEventListener(EVENTO_CAMBIO, callback);
  return () => window.removeEventListener(EVENTO_CAMBIO, callback);
}
