import { useEffect, useRef, useState } from 'react';

// Lógica compartida de "abrir/cerrar al hacer click afuera o presionar Escape" -- la usan
// UserMenu y el dropdown "Gestión" del Header, para no duplicar el mismo listener dos veces.
function useDropdown<T extends HTMLElement>() {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!abierto) return;
    function manejarClickAfuera(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
    }
    function manejarEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setAbierto(false);
    }
    document.addEventListener('mousedown', manejarClickAfuera);
    document.addEventListener('keydown', manejarEscape);
    return () => {
      document.removeEventListener('mousedown', manejarClickAfuera);
      document.removeEventListener('keydown', manejarEscape);
    };
  }, [abierto]);

  return { ref, abierto, setAbierto, alternar: () => setAbierto((v) => !v) };
}

export default useDropdown;
