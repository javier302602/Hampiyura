import { useState } from 'react';
import { calificarPublicacion } from '../api/comunidad.api';

interface Props {
  publicacionId: string;
  miValoracionInicial: number | null;
  onCalificado: () => void;
}

// RF-14: recalificar actualiza la misma valoración (nunca crea una segunda) -- el backend ya
// resuelve esto en CalificarPublicacionUseCase; aquí solo mostramos la calificación previa del
// usuario (si existe) y dejamos que la vuelva a elegir.
function ValoracionEstrellas({ publicacionId, miValoracionInicial, onCalificado }: Props) {
  const [miValoracion, setMiValoracion] = useState(miValoracionInicial);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function calificar(estrellas: number) {
    setEnviando(true);
    setError(null);
    try {
      await calificarPublicacion(publicacionId, estrellas);
      setMiValoracion(estrellas);
      onCalificado();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar tu calificación.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <div className="estrellas">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" disabled={enviando} className={miValoracion && n <= miValoracion ? 'activa' : ''} onClick={() => calificar(n)} aria-label={`Calificar con ${n} estrella(s)`}>
            ★
          </button>
        ))}
      </div>
      {miValoracion ? <span className="comentario-meta">Tu calificación: {miValoracion} ★ (puedes cambiarla)</span> : <span className="comentario-meta">Aún no has calificado</span>}
      {error && <p className="error-formulario">{error}</p>}
    </div>
  );
}

export default ValoracionEstrellas;
