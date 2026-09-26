import { ReactNode, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface Props {
  titulo: string;
  onCerrar: () => void;
  children: ReactNode;
  // Botones de acción (van fijos abajo, siempre visibles aunque el contenido haga scroll).
  pie?: ReactNode;
}

// Diálogo modal accesible: role="dialog" + aria-modal, se cierra con Escape o clic en el fondo, devuelve
// el foco al elemento que lo abrió y mantiene el foco dentro mientras está abierto. Superficie
// "elevada" del design system (--color-surface-elevated).
function Modal({ titulo, onCerrar, children, pie }: Props) {
  const dialogoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previo = document.activeElement as HTMLElement | null;
    const dialogo = dialogoRef.current;
    dialogo?.focus();
    const bloqueoPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function alTeclear(e: KeyboardEvent) {
      if (e.key === 'Escape') { e.stopPropagation(); onCerrar(); return; }
      if (e.key !== 'Tab' || !dialogo) return;
      const focoables = dialogo.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
      if (focoables.length === 0) return;
      const primero = focoables[0];
      const ultimo = focoables[focoables.length - 1];
      if (e.shiftKey && (document.activeElement === primero || document.activeElement === dialogo)) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
    }
    document.addEventListener('keydown', alTeclear);
    return () => {
      document.removeEventListener('keydown', alTeclear);
      document.body.style.overflow = bloqueoPrevio;
      previo?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onCerrar cambia en cada render del padre; el efecto solo debe montarse una vez
  }, []);

  return (
    <div className="modal-fondo" onMouseDown={(e) => { if (e.target === e.currentTarget) onCerrar(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={titulo} tabIndex={-1} ref={dialogoRef}>
        <header className="modal-cabecera">
          <h2 className="modal-titulo">{titulo}</h2>
          <button type="button" className="icon-btn" aria-label="Cerrar" onClick={onCerrar}><X size={18} aria-hidden="true" /></button>
        </header>
        <div className="modal-cuerpo">{children}</div>
        {pie && <footer className="modal-pie">{pie}</footer>}
      </div>
    </div>
  );
}

export default Modal;
